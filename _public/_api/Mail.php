<?php
namespace HoseaApi;
use vielhuber\mailhelper\mailhelper;

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
        if ($mails === false) {
            $this->response([
                'success' => false
            ]);
        }
        $this->response([
            'success' => true,
            'data' => $mails
        ]);
    }

    public function buildCache($force = false)
    {
        $mails = [];
        $filename_cache = sys_get_temp_dir() . '/hosea-mail.cache';

        if (
            in_array(@$_SERVER['SERVER_ADMIN'], ['david@vielhuber.de']) ||
            $force === true ||
            !file_exists($filename_cache) ||
            filemtime($filename_cache) < strtotime('now - 5 minutes')
        ) {
            $mails = $this->prepareMails();
            if ($mails === false) {
                return false;
            }
            file_put_contents($filename_cache, serialize($mails));
        } elseif (file_exists($filename_cache)) {
            $mails = unserialize(file_get_contents($filename_cache));
        }
        return $mails;
    }

    protected function prepareMails()
    {
        $mails = [];
        $config = $this->getMailConfig();

        foreach ($config as $config__key => $config__value) {
            if (!isset($config__value['imap'])) {
                continue;
            }
            try {
                $mailhelper = new mailhelper($config);
                $folders = $mailhelper->getFolders(mailbox: $config__key);
                foreach ($folders as $folders__value) {
                    if ($folders__value !== $config__value['imap']['folder_inbox']) {
                        continue;
                    }
                    $messages = $mailhelper->fetchMails(
                        mailbox: $config__key,
                        folder: $config__value['imap']['folder_inbox']
                    );
                    $runtime_start = microtime(true);
                    foreach ($messages as $messages__value) {
                        $mail_data = $mailhelper->viewMail(
                            mailbox: $config__key,
                            folder: $config__value['imap']['folder_inbox'],
                            id: $messages__value->id
                        );
                        $mail_data = $this->getMailData($mail_data);
                        $mail_data['mailbox'] = $config__key;
                        $mail_data['editors'] = isset($_SERVER['EDITORS']) ? explode(';', $_SERVER['EDITORS']) : [];
                        $mails[] = $mail_data;
                        if (microtime(true) - $runtime_start > 60) {
                            break;
                        }
                    }
                }
            } catch (\Throwable $e) {
                return false;
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

    protected function getMailConfig()
    {
        $config = [];

        foreach (explode(';', $_SERVER['MAILBOX_EMAIL'] ?? '') as $parts__key => $parts__value) {
            $config[explode(';', $_SERVER['MAILBOX_EMAIL'] ?? '')[$parts__key]] = [
                'imap' => [
                    'host' => explode(';', $_SERVER['MAILBOX_HOST'])[$parts__key],
                    'port' => explode(';', $_SERVER['MAILBOX_PORT'])[$parts__key],
                    'username' => explode(';', $_SERVER['MAILBOX_USERNAME'])[$parts__key],
                    'password' => explode(';', $_SERVER['MAILBOX_PASSWORD'])[$parts__key],
                    'tenant_id' => explode(';', $_SERVER['MAILBOX_OAUTH_TENANT_ID'])[$parts__key],
                    'client_id' => explode(';', $_SERVER['MAILBOX_OAUTH_CLIENT_ID'])[$parts__key],
                    'client_secret' => explode(';', $_SERVER['MAILBOX_OAUTH_CLIENT_SECRET'])[$parts__key],
                    'encryption' => explode(';', $_SERVER['MAILBOX_ENCRYPTION'])[$parts__key],
                    'folder_inbox' => explode(';', $_SERVER['MAILBOX_FOLDER_INBOX'])[$parts__key],
                    'folder_archive' => explode(';', $_SERVER['MAILBOX_FOLDER_ARCHIVE'])[$parts__key]
                ]
            ];
        }

        $config[$_SERVER['SMTP_EMAIL'] ?? ''] = [
            'smtp' => [
                'host' => $_SERVER['SMTP_HOST'] ?? '',
                'port' => $_SERVER['SMTP_PORT'] ?? '',
                'username' => $_SERVER['SMTP_USERNAME'] ?? '',
                'password' => $_SERVER['SMTP_PASSWORD'] ?? '',
                'tenant_id' => $_SERVER['SMTP_OAUTH_TENANT_ID'] ?? '',
                'client_id' => $_SERVER['SMTP_OAUTH_CLIENT_ID'] ?? '',
                'client_secret' => $_SERVER['SMTP_OAUTH_CLIENT_SECRET'] ?? '',
                'encryption' => $_SERVER['SMTP_ENCRYPTION'] ?? '',
                'from_name' => $_SERVER['SMTP_FROM_NAME'] ?? ''
            ]
        ];

        return $config;
    }

    protected function update()
    {
        $id = $this->getInput('id');
        $mailbox = $this->getInput('mailbox');
        $action_send = $this->getInput('action_send');
        $action_send_text = $this->getInput('action_send_text');
        $action_ticket_time = $this->getInput('action_ticket_time');

        $config = $this->getMailConfig();
        $mailhelper = new mailhelper($config);
        $mail = $mailhelper->viewMail(mailbox: $mailbox, folder: $config[$mailbox]['imap']['folder_inbox'], id: $id);
        $mailhelper->readMail(mailbox: $mailbox, folder: $config[$mailbox]['imap']['folder_inbox'], id: $id);
        $mailhelper->moveMail(
            mailbox: $mailbox,
            folder: $config[$mailbox]['imap']['folder_inbox'],
            id: $id,
            name: $config[$mailbox]['imap']['folder_archive']
        );

        if (!empty($action_send)) {
            foreach ($action_send as $action_send__value) {
                $recipient = null;
                $subject = '';
                $body = '';

                $mail = $this->getMailData($mail);
                if ($action_send__value === 'sender') {
                    $recipient = [
                        'name' => $mail['from_name'],
                        'email' => $mail['from_email']
                    ];
                    $subject = 'AW: ' . $mail['subject'];
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
                    $subject = 'FW: ' . $mail['subject'];
                    $body .= $action_send_text != '' ? $action_send_text : 'Kannst Du Dich bitte darum kümmern?';
                }

                $body .= '<br/><br/><br/><hr/><br/><br/><br/>';
                $body .= $mail['content'];
                $mailhelper->sendMail(
                    mailbox: $_SERVER['SMTP_EMAIL'] ?? '',
                    subject: $subject,
                    content: $body,
                    to: $recipient,
                    from_name: $_SERVER['SMTP_FROM_NAME'] ?? ''
                );
            }
        }

        if ($this->buildCache(true) === false) {
            $this->response([
                'success' => false
            ]);
        }

        $this->response([
            'success' => true,
            'data' => [
                'id' => $id
            ]
        ]);
    }

    protected function getMailData($messages__value)
    {
        return [
            'id' => $messages__value->id,
            'from_name' => $messages__value->from[0]->name,
            'from_email' => $messages__value->from[0]->email,
            'to' => $messages__value->to[0]->email,
            'date' => $messages__value->date,
            'subject' => $messages__value->subject,
            'content' => $messages__value->content_html
            //'eml' => $messages__value->eml,
        ];
    }
}
