<?php
namespace HoseaApi;

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
                    'username' => explode(';', $_SERVER['MAILBOX_USERNAME'])[$parts__key],
                    'password' => explode(';', $_SERVER['MAILBOX_PASSWORD'])[$parts__key],
                    'folder_inbox' => explode(';', $_SERVER['MAILBOX_FOLDER_INBOX'])[$parts__key],
                    'folder_archive' => explode(';', $_SERVER['MAILBOX_FOLDER_ARCHIVE'])[$parts__key],
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
        $mails = [];

        foreach ($this->settings as $settings__value) {
            try {
                $mailbox = new \PhpImap\Mailbox(
                    '{' .
                        $settings__value['host'] .
                        ':' .
                        $settings__value['port'] .
                        '/imap/ssl}' .
                        $settings__value['folder_inbox'],
                    $settings__value['username'],
                    $settings__value['password'],
                    sys_get_temp_dir(),
                    'UTF-8'
                );
                $mails_ids = $mailbox->searchMailbox('ALL');
                foreach ($mails_ids as $mails_id__value) {
                    $mail_data = $this->getMailData($mails_id__value, $mailbox);
                    $mail_data['mailbox'] = $settings__value['username'];
                    $mail_data['editors'] = isset($_SERVER['EDITORS']) ? explode(';', $_SERVER['EDITORS']) : [];
                    $mails[] = $mail_data;
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        usort($mails, function ($a, $b) {
            if ($a['date'] === $b['date']) {
                return -1 * ($a['id'] <=> $b['id']);
            }
            return -1 * (strtotime($a['date']) <=> strtotime($b['date']));
        });

        $this->response([
            'success' => true,
            'data' => $mails,
        ]);
    }

    protected function update()
    {
        $id = $this->getInput('id');
        $mailbox = $this->getMailbox($this->getInput('mailbox'));
        $mail_data = $this->getMailData($id, $mailbox);
        $action_send = $this->getInput('action_send');
        $action_send_text = $this->getInput('action_send_text');
        $action_ticket_time = $this->getInput('action_ticket_time');

        $this->archiveMail($id, $this->getInput('mailbox'));

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

        $this->response([
            'success' => true,
            'data' => [
                'id' => $id,
            ],
        ]);
    }

    protected function getMailData($mail_id, $mailbox)
    {
        $mail = $mailbox->getMail($mail_id);
        $mail->embedImageAttachments();
        $eml_filename = tempnam(sys_get_temp_dir(), 'mail_') . '.eml';
        $mailbox->saveMail($mail_id, $eml_filename);
        return [
            'id' => (string) $mail->id,
            'from_name' => (string) (isset($mail->fromName) ? $mail->fromName : $mail->fromAddress),
            'from_email' => (string) $mail->fromAddress,
            'to' => (string) $mail->toString,
            'date' => $mail->date,
            'subject' => (string) $mail->subject,
            'eml' => base64_encode(file_get_contents($eml_filename)),
            'content' =>
                $mail->textHtml != ''
                    ? (mb_detect_encoding($mail->textHtml, 'UTF-8, ISO-8859-1') !== 'UTF-8'
                        ? utf8_encode($mail->textHtml)
                        : $mail->textHtml)
                    : (mb_detect_encoding($mail->textPlain, 'UTF-8, ISO-8859-1') !== 'UTF-8'
                        ? nl2br(utf8_encode($mail->textPlain))
                        : nl2br($mail->textPlain)),
        ];
    }

    protected function getMailbox($mailbox_name)
    {
        foreach ($this->settings as $settings__value) {
            if ($settings__value['username'] != $mailbox_name) {
                continue;
            }
            try {
                return new \PhpImap\Mailbox(
                    '{' .
                        $settings__value['host'] .
                        ':' .
                        $settings__value['port'] .
                        '/imap/ssl}' .
                        $settings__value['folder_inbox'],
                    $settings__value['username'],
                    $settings__value['password'],
                    sys_get_temp_dir(),
                    'UTF-8'
                );
            } catch (\Exception $e) {
                continue;
            }
        }
        return null;
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

    protected function archiveMail($id, $mailbox_name)
    {
        $mailbox = $this->getMailbox($mailbox_name);
        $mailbox->moveMail($id, $this->getMailboxSettings($mailbox_name)['folder_archive']);
        $mailbox->markMailAsRead($id);
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
