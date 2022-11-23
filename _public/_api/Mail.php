<?php
namespace HoseaApi;
use Webklex\PHPIMAP\ClientManager;

class Mail extends Api
{
    public $settings = [];

    public function __construct()
    {
        $this->setupSettings();
    }

    protected function setupSettings()
    {
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
        $dotenv->load();
        if (@$_SERVER['MAILBOX_HOST'] != '') {
            foreach (explode(';', $_SERVER['MAILBOX_HOST']) as $parts__key => $parts__value) {
                $this->settings[] = [
                    'host' => explode(';', $_SERVER['MAILBOX_HOST'])[$parts__key],
                    'port' => explode(';', $_SERVER['MAILBOX_PORT'])[$parts__key],
                    'encryption' => explode(';', $_SERVER['MAILBOX_ENCRYPTION'])[$parts__key],
                    'authentication' => explode(';', $_SERVER['MAILBOX_AUTHENTICATION'])[$parts__key],
                    'username' => explode(';', $_SERVER['MAILBOX_USERNAME'])[$parts__key],
                    'password' => explode(';', $_SERVER['MAILBOX_PASSWORD'])[$parts__key],
                    'folder_inbox' => explode(';', $_SERVER['MAILBOX_FOLDER_INBOX'])[$parts__key],
                    'folder_archive' => explode(';', $_SERVER['MAILBOX_FOLDER_ARCHIVE'])[$parts__key],
                    'oauth_tenant_id' => explode(';', $_SERVER['MAILBOX_OAUTH_TENANT_ID'])[$parts__key],
                    'oauth_client_id' => explode(';', $_SERVER['MAILBOX_OAUTH_CLIENT_ID'])[$parts__key],
                    'oauth_client_secret' => explode(';', $_SERVER['MAILBOX_OAUTH_CLIENT_SECRET'])[$parts__key],
                ];
            }
        }
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'mails' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
        if (
            $this->getRequestMethod() === 'PUT' &&
            $this->getRequestPathFirst() === 'mails' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->update();
        }
    }

    protected function index()
    {
        $mails = $this->buildCache();
        $this->response([
            'success' => true,
            'data' => $mails,
        ]);
    }

    public function buildCache($force = false)
    {
        $mails = [];
        $filename_cache = sys_get_temp_dir() . '/hosea-mail.cache';

        if (
            $force === true ||
            !file_exists($filename_cache) ||
            filemtime($filename_cache) < strtotime('now - 5 minutes')
        ) {
            $mails = $this->prepareMails();
            file_put_contents($filename_cache, serialize($mails));
        } elseif (file_exists($filename_cache)) {
            $mails = unserialize(file_get_contents($filename_cache));
        }
        return $mails;
    }

    protected function prepareMails()
    {
        $mails = [];

        foreach ($this->settings as $settings__value) {
            $client = $this->connectToMailbox($settings__value);

            $folders = $client->getFolders();
            foreach ($folders as $folder) {
                if ($folder->full_name !== $settings__value['folder_inbox']) {
                    continue;
                }
                $messages = $folder
                    ->messages()
                    ->all()
                    ->get();
                $runtime_start = microtime(true);
                foreach ($messages as $messages__value) {
                    $mail_data = $this->getMailData($messages__value);
                    $mail_data['mailbox'] = $settings__value['username'];
                    $mail_data['editors'] = isset($_SERVER['EDITORS']) ? explode(';', $_SERVER['EDITORS']) : [];
                    $mails[] = $mail_data;
                    if (microtime(true) - $runtime_start > 60) {
                        break;
                    }
                }
            }
        }

        usort($mails, function ($a, $b) {
            if ($a['date'] === $b['date']) {
                return -1 * ($a['id'] <=> $b['id']);
            }
            return -1 * (strtotime($a['date']) <=> strtotime($b['date']));
        });

        return $mails;
    }

    protected function connectToMailbox($settings__value)
    {
        $cm = new ClientManager();
        if ($settings__value['authentication'] === 'oauth') {
            $ch = curl_init();
            try {
                curl_setopt(
                    $ch,
                    CURLOPT_URL,
                    'https://login.microsoftonline.com/' . $settings__value['oauth_tenant_id'] . '/oauth2/v2.0/token'
                );
                curl_setopt(
                    $ch,
                    CURLOPT_POSTFIELDS,
                    http_build_query([
                        'client_id' => $settings__value['oauth_client_id'],
                        'client_secret' => $settings__value['oauth_client_secret'],
                        'scope' => 'https://outlook.office365.com/.default',
                        'grant_type' => 'client_credentials',
                    ])
                );
                curl_setopt($ch, CURLOPT_POST, 1);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $curl_result = curl_exec($ch);
                if (empty($curl_result)) {
                    throw new \Exception('Missing results.');
                }
                $curl_result = json_decode($curl_result);
                if (empty($curl_result)) {
                    throw new \Exception('Error decoding json result.');
                }
                if (!isset($curl_result->access_token)) {
                    throw new \Exception('Missing access token from result.');
                }
                $access_token = $curl_result->access_token;
            } finally {
                curl_close($ch);
            }
            $client = $cm->make([
                'host' => $settings__value['host'],
                'port' => $settings__value['port'],
                'encryption' => $settings__value['encryption'],
                'validate_cert' => true,
                'username' => $settings__value['username'],
                'password' => $access_token,
                'protocol' => 'imap',
                'authentication' => 'oauth',
            ]);
        }
        if ($settings__value['authentication'] === 'basic') {
            $client = $cm->make([
                'host' => $settings__value['host'],
                'port' => $settings__value['port'],
                'encryption' => $settings__value['encryption'],
                'validate_cert' => true,
                'username' => $settings__value['username'],
                'password' => $settings__value['password'],
                'protocol' => 'imap',
                'authentication' => null,
            ]);
        }
        $client->connect();
        return $client;
    }

    protected function update()
    {
        $id = $this->getInput('id');
        $mailbox = $this->getInput('mailbox');
        $action_send = $this->getInput('action_send');
        $action_send_text = $this->getInput('action_send_text');
        $action_ticket_time = $this->getInput('action_ticket_time');

        $mail = null;
        foreach ($this->settings as $settings__value) {
            if ($settings__value['username'] !== $mailbox) {
                continue;
            }
            $client = $this->connectToMailbox($settings__value);
            $folders = $client->getFolders();
            foreach ($folders as $folder) {
                if ($folder->full_name !== $settings__value['folder_inbox']) {
                    continue;
                }
                $messages = $folder
                    ->messages()
                    ->all()
                    ->get();
                foreach ($messages as $messages__value) {
                    if ($messages__value->getMessageId()[0] !== $id) {
                        continue;
                    }
                    $mail = $messages__value;
                }
            }
        }

        $mail_data = $this->getMailData($mail);

        $mail->setFlag('Seen');
        $mail->move($this->getMailboxSettings($mailbox)['folder_archive']);

        if (!empty($action_send)) {
            foreach ($action_send as $action_send__value) {
                $recipient = null;
                $subject = '';
                $body = '';

                if ($action_send__value === 'sender') {
                    $recipient = [
                        'name' => $mail_data['from_name'],
                        'email' => $mail_data['from_email'],
                    ];
                    $subject = 'AW: ' . $mail_data['subject'];
                    $body .= 'Ich melde mich diesbezüglich ';
                    if ($action_ticket_time == 'tonight') {
                        $body .= 'heute Abend';
                    } elseif ($action_ticket_time == 'weekend') {
                        $body .= 'Anfang kommender Woche';
                    } else {
                        $body .= 'in Kürze';
                    }
                    $body .= ' zurück.';
                } else {
                    $recipient = $action_send__value;
                    $subject = 'FW: ' . $mail_data['subject'];
                    $body .= $action_send_text != '' ? $action_send_text : 'Kannst Du Dich bitte darum kümmern?';
                }

                $body .= '<br/><br/><br/><hr/><br/><br/><br/>';
                $body .= $mail_data['content'];
                $this->mailSend($recipient, $subject, $body);
            }
        }

        $this->buildCache(true);

        $this->response([
            'success' => true,
            'data' => [
                'id' => $id,
            ],
        ]);
    }

    protected function getMailData($messages__value)
    {
        $content =
            $messages__value->getHTMLBody() != ''
                ? $messages__value->getHTMLBody()
                : nl2br($messages__value->getTextBody());
        // trim bad tags
        foreach (['iframe', 'script'] as $tags__value) {
            $content = preg_replace('/<' . $tags__value . '.*?>(.*)?<\/' . $tags__value . '>/ims', '', $content);
        }

        $subject = @$messages__value->getSubject()[0];
        $subject = trim($subject);
        $subject = preg_replace("/\r\n|\r|\n/", '', trim(@$messages__value->getSubject()[0]));
        if (mb_detect_encoding($subject, 'UTF-8, ISO-8859-1') !== 'UTF-8') {
            $subject = utf8_encode($subject);
        }

        return [
            'id' => $messages__value->getMessageId()[0],
            'from_name' => $messages__value->getFrom()[0]->personal,
            'from_email' => $messages__value->getFrom()[0]->mail,
            'to' => $messages__value->getTo()[0]->mail,
            'date' => $messages__value
                ->getDate()
                ->toDate()
                ->format('Y-m-d H:i:s'),
            'subject' => $subject,
            'eml' => base64_encode(
                json_decode(json_encode($messages__value->getHeader()), true)['raw'] . $messages__value->getRawBody()
            ),
            'content' => $content,
        ];
    }

    protected function getMailboxSettings($mailbox_name)
    {
        foreach ($this->settings as $settings__value) {
            if ($settings__value['username'] != $mailbox_name) {
                continue;
            }
            return $settings__value;
        }
        return null;
    }

    protected function mailSend($recipients, $subject = '', $content = '', $attachments = null)
    {
        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = @$_SERVER['SMTP_HOST'];
            $mail->Port = @$_SERVER['SMTP_PORT'];
            $mail->Username = @$_SERVER['SMTP_USERNAME'];
            $mail->Password = @$_SERVER['SMTP_PASSWORD'];
            $mail->SMTPSecure = @$_SERVER['SMTP_ENCRYPTION'];
            $mail->setFrom(@$_SERVER['SMTP_FROM_ADDRESS'], @$_SERVER['SMTP_FROM_NAME']);
            $mail->SMTPAuth = true;
            $mail->SMTPOptions = [
                'tls' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true],
                'ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true],
            ];
            $mail->CharSet = 'utf-8';
            $mail->isHTML(true);

            // only send on production to real recipient
            if (in_array(@$_SERVER['SERVER_ADMIN'], ['david@close2.de'])) {
                $recipients = $_SERVER['SERVER_ADMIN'];
            }
            if (!is_array($recipients) || isset($recipients['email'])) {
                $recipients = [$recipients];
            }
            foreach ($recipients as $recipients__value) {
                if (is_string($recipients__value) && $recipients__value != '') {
                    $mail->addAddress($recipients__value);
                } elseif (is_array($recipients__value)) {
                    if (
                        isset($recipients__value['email']) &&
                        $recipients__value['email'] != '' &&
                        isset($recipients__value['name']) &&
                        $recipients__value['name'] != ''
                    ) {
                        $mail->addAddress($recipients__value['email'], $recipients__value['name']);
                    } elseif (isset($recipients__value['email']) && $recipients__value['email'] != '') {
                        $mail->addAddress($recipients__value['email']);
                    }
                }
            }

            // embed images
            $images = [];
            preg_match_all('/src="([^"]*)"/i', $content, $images);
            $images = $images[1];
            $images = array_unique($images);
            foreach ($images as $images__value) {
                if (strpos($images__value, 'cid:') === false && strpos($images__value, 'http') === false) {
                    $image_cid = md5($images__value);

                    $image_extension = $images__value;
                    if (strpos($images__value, 'base64,') !== false) {
                        if (strpos($images__value, 'image/png') !== false) {
                            $image_extension = 'png';
                        } else {
                            $image_extension = 'jpg';
                        }
                    } else {
                        $image_extension = explode('.', $image_extension);
                        $image_extension = $image_extension[count($image_extension) - 1];
                    }

                    $image_baseurl = $_SERVER['DOCUMENT_ROOT']; // modify this if needed

                    $image_tmp_path = sys_get_temp_dir() . '/' . md5(uniqid()) . '.' . $image_extension;

                    // base64
                    if (strpos($images__value, 'base64,') !== false) {
                        file_put_contents(
                            $image_tmp_path,
                            base64_decode(
                                trim(substr($images__value, strpos($images__value, 'base64,') + strlen('base64')))
                            )
                        );
                        $content = str_replace($images__value, 'cid:' . $image_cid, $content);
                        $mail->addEmbeddedImage($image_tmp_path, $image_cid);
                    }

                    // relative paths
                    elseif (file_exists($image_baseurl . '/' . $images__value)) {
                        $content = str_replace($images__value, 'cid:' . $image_cid, $content);
                        $mail->addEmbeddedImage($image_baseurl . '/' . $images__value, $image_cid);
                    }
                }
            }

            $mail->Subject = $subject;
            $mail->Body = $content;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\r\n", $content));
            if ($attachments !== null) {
                if (!is_array($attachments) || isset($attachments['file'])) {
                    $attachments = [$attachments];
                }
                if (!empty($attachments)) {
                    foreach ($attachments as $attachments__value) {
                        if (
                            is_string($attachments__value) &&
                            $attachments__value != '' &&
                            file_exists($attachments__value)
                        ) {
                            $mail->addAttachment($attachments__value);
                        } elseif (is_array($attachments__value)) {
                            if (
                                isset($attachments__value['file']) &&
                                $attachments__value['file'] != '' &&
                                isset($attachments__value['name']) &&
                                $attachments__value['name'] != '' &&
                                file_exists($attachments__value['file'])
                            ) {
                                $mail->addAttachment($attachments__value['file'], $attachments__value['name']);
                            } elseif (
                                isset($attachments__value['file']) &&
                                $attachments__value['file'] != '' &&
                                file_exists($attachments__value['file'])
                            ) {
                                $mail->addAttachment($attachments__value['file']);
                            }
                        }
                    }
                }
            }
            $mail->send();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
