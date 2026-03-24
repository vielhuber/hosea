<?php

namespace HoseaApi;

use vielhuber\simplemcp\Attributes\McpTool;
use vielhuber\simplemcp\Attributes\Schema;

class MCP
{
    use DateParserTrait;

    private \vielhuber\dbhelper\dbhelper $db;

    public function __construct()
    {
        // load root .env for DB credentials (simplemcp already loaded _mcp/.env)
        \Dotenv\Dotenv::createImmutable(__DIR__ . '/../../')->safeLoad();

        $this->db = new \vielhuber\dbhelper\dbhelper();
        $this->db->connect(
            'pdo',
            $_SERVER['DB_CONNECTION'],
            $_SERVER['DB_HOST'],
            $_SERVER['DB_USERNAME'],
            $_SERVER['DB_PASSWORD'],
            $_SERVER['DB_DATABASE'],
            $_SERVER['DB_PORT']
        );
    }

    // --- MCP Tools ---

    /**
     * Create a new appointment.
     *
     * @return string
     */
    #[
        McpTool(
            description: 'Create a new appointment. Date must be YYYY-MM-DD. Optional time_from/time_to in HH:MM format.'
        )
    ]
    public function createAppointment(
        #[Schema(type: 'string', description: 'Title of the appointment.')] string $project,
        #[Schema(type: 'string', description: 'Date in ISO format YYYY-MM-DD.')] string $date,
        #[Schema(type: 'string', description: 'Optional start time HH:MM.')] string $timeFrom = '',
        #[Schema(type: 'string', description: 'Optional end time HH:MM.')] string $timeTo = '',
        #[Schema(type: 'string', description: 'Optional description or notes.')] string $description = '',
        #[
            Schema(type: 'string', description: 'Status: fixed (default), allday, todo, scheduled.')
        ]
        string $status = 'fixed',
        #[Schema(type: 'string', description: 'Priority: A, B, C or empty.')] string $priority = '',
        #[
            Schema(type: 'string', description: 'Optional duration in hours (can differ from time_from/time_to).')
        ]
        string $time = ''
    ): string {
        $dateFormatted = $this->isoToAppDate($date, $timeFrom, $timeTo);
        $id = $this->db->insert('tickets', [
            'status' => $status,
            'priority' => $priority,
            'date' => $dateFormatted,
            'time' => $time,
            'project' => $project,
            'description' => $description,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
        return json_encode(['success' => true, 'id' => $id]);
    }

    /**
     * Read appointments, optionally filtered by date range or search term.
     *
     * @return string
     */
    #[McpTool(description: 'Read appointments. Optionally filter by date_from/date_to (YYYY-MM-DD) or a search term.')]
    public function readAppointments(
        #[Schema(type: 'string', description: 'Optional start date filter YYYY-MM-DD.')] string $dateFrom = '',
        #[Schema(type: 'string', description: 'Optional end date filter YYYY-MM-DD.')] string $dateTo = '',
        #[Schema(type: 'string', description: 'Optional search string for project or description.')] string $search = ''
    ): string {
        $tickets = $this->db->fetch_all(
            'SELECT id, status, priority, date, time, project, description, updated_at
             FROM tickets
             ORDER BY id DESC'
        );

        $result = [];
        foreach ($tickets as $ticket) {
            if ($search !== '' && stripos($ticket['project'] . ' ' . $ticket['description'], $search) === false) {
                continue;
            }
            $parsedDates = $this->parseDateString($ticket['date'] ?? '');
            $matchesDates = false;
            $expandedDates = [];
            foreach ($parsedDates as $parsed) {
                $d = $parsed['date'] ?? '';
                if ($d === '') {
                    $matchesDates = true;
                    continue;
                }
                if ($dateFrom !== '' && $d < $dateFrom) {
                    continue;
                }
                if ($dateTo !== '' && $d > $dateTo) {
                    continue;
                }
                $matchesDates = true;
                $expandedDates[] = $parsed;
            }
            if (!$matchesDates && ($dateFrom !== '' || $dateTo !== '')) {
                continue;
            }
            $result[] = [
                'id' => $ticket['id'],
                'status' => $ticket['status'],
                'priority' => $ticket['priority'],
                'project' => $ticket['project'],
                'description' => $ticket['description'],
                'time' => $ticket['time'],
                'date_raw' => $ticket['date'],
                'dates' => $expandedDates ?: $parsedDates,
                'updated_at' => $ticket['updated_at']
            ];
        }

        return json_encode(['success' => true, 'data' => $result]);
    }

    /**
     * Update an existing appointment by ID.
     *
     * @return string
     */
    #[McpTool(description: 'Update an existing appointment by ID. Only provided fields are updated.')]
    public function updateAppointment(
        #[Schema(type: 'integer', description: 'ID of the appointment to update.')] int $id,
        #[Schema(type: 'string', description: 'New title.')] string $project = '',
        #[Schema(type: 'string', description: 'New date YYYY-MM-DD.')] string $date = '',
        #[Schema(type: 'string', description: 'New start time HH:MM.')] string $timeFrom = '',
        #[Schema(type: 'string', description: 'New end time HH:MM.')] string $timeTo = '',
        #[Schema(type: 'string', description: 'New description.')] string $description = '',
        #[Schema(type: 'string', description: 'New status: fixed, allday, todo, scheduled.')] string $status = '',
        #[Schema(type: 'string', description: 'New priority: A, B, C or empty.')] string $priority = '',
        #[
            Schema(type: 'string', description: 'New duration in hours (can differ from time_from/time_to).')
        ]
        string $time = ''
    ): string {
        if (!$this->ticketExists($id)) {
            return json_encode(['success' => false, 'message' => 'Not found.']);
        }
        $values = ['updated_at' => date('Y-m-d H:i:s')];
        if ($project !== '') {
            $values['project'] = $project;
        }
        if ($description !== '') {
            $values['description'] = $description;
        }
        if ($status !== '') {
            $values['status'] = $status;
        }
        if ($priority !== '') {
            $values['priority'] = $priority;
        }
        if ($time !== '') {
            $values['time'] = $time;
        }
        if ($date !== '') {
            // preserve existing time portion if no new time is provided
            if ($timeFrom === '' && $timeTo === '') {
                $existing = $this->db->fetch_var('SELECT date FROM tickets WHERE id = ?', $id);
                [$timeFrom, $timeTo] = $this->extractTimeFromDate($existing ?? '');
                $timeFrom = $timeFrom ?? '';
                $timeTo = $timeTo ?? '';
            }
            $values['date'] = $this->isoToAppDate($date, $timeFrom, $timeTo);
        }
        $this->db->update('tickets', $values, ['id' => $id]);
        return json_encode(['success' => true, 'id' => $id]);
    }

    /**
     * Delete an appointment by ID.
     *
     * @return string
     */
    #[McpTool(description: 'Delete an appointment by ID.')]
    public function deleteAppointment(
        #[Schema(type: 'integer', description: 'ID of the appointment to delete.')] int $id
    ): string {
        if (!$this->ticketExists($id)) {
            return json_encode(['success' => false, 'message' => 'Not found.']);
        }
        $this->db->delete('tickets', ['id' => $id]);
        return json_encode(['success' => true]);
    }

    // --- Helpers ---

    private function ticketExists(int $id): bool
    {
        return (int) $this->db->fetch_var('SELECT COUNT(*) FROM tickets WHERE id = ?', $id) > 0;
    }

    /**
     * Convert ISO date (YYYY-MM-DD) to the app's storage format (DD.MM.YY [HH:MM-HH:MM]).
     */
    private function isoToAppDate(string $iso, string $timeFrom = '', string $timeTo = ''): string
    {
        $dt = \DateTimeImmutable::createFromFormat('Y-m-d', $iso);
        if ($dt === false) {
            return $iso;
        }
        $formatted = $dt->format('d.m.y');
        if ($timeFrom !== '' && $timeTo !== '') {
            $formatted .= ' ' . $timeFrom . '-' . $timeTo;
        }
        return $formatted;
    }
}
