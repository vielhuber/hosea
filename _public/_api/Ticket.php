<?php
namespace HoseaApi;

class Ticket extends Api
{

    public $cols = ['id', 'status', 'priority', 'date', 'time', 'project', 'description', 'user_id'];

    public function __construct()
    {
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'tickets' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->show($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'POST' &&
            $this->getRequestPathFirst() === 'tickets' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->create();
        }
        if (
            $this->getRequestMethod() === 'PUT' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->update($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'PUT' &&
            $this->getRequestPathFirst() === 'tickets' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->bulkUpdate();
        }
        if (
            $this->getRequestMethod() === 'DELETE' &&
            $this->getRequestPathFirst() === 'tickets' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->delete($this->getRequestPathSecond());
        }
    }

    protected function index()
    {
        $tickets = $this::$db->fetch_all(
            'SELECT '.implode(',',$this->colsWithout('user_id')).' FROM tickets WHERE user_id = ?',
            $this::$auth->getCurrentUserId()
        );
        foreach($tickets as $tickets__key=>$tickets__value)
        {
            $tickets[$tickets__key]['attachments'] = $this::$db->fetch_all(
                'SELECT '.implode(',',$this->Attachment->colsWithout('data','ticket_id')).' FROM attachments WHERE ticket_id = ?',
                $tickets[$tickets__key]['id']
            );
        }
        $this->response([
            'success' => true,
            'data' => $tickets
        ]);
    }

    protected function show($id)
    {
        $this->checkId($id);
        $ticket = $this::$db->fetch_row(
            'SELECT '.implode(',',$this->colsWithout('user_id')).' FROM tickets WHERE id = ? AND user_id = ?',
            $id,
            $this::$auth->getCurrentUserId()
        );
        $ticket['attachments'] = $this::$db->fetch_all(
            'SELECT '.implode(',',$this->Attachment->colsWithout('data','ticket_id')).' FROM attachments WHERE ticket_id = ?',
            $ticket['id']
        );
        $this->response([
            'success' => true,
            'data' => $ticket
        ]);
    }

    protected function create()
    {
        $values = [];
        foreach ( $this->colsWithout('id','user_id') as $columns__value ) {
            $values[$columns__value] = $this->getInput($columns__value);
        }
        $values['user_id'] = $this::$auth->getCurrentUserId();
        $id = $this::$db->insert('tickets', $values);
        $this->response([
            'success' => true,
            'data' => [
                'id' => $id
            ]
        ]);
    }

    protected function update($id)
    {
        $this->checkId($id);
        $values = [];
        foreach ( $this->colsWithout('id','user_id') as $columns__value ) {
            if ($this->getInput($columns__value) !== null) {
                $values[$columns__value] = $this->getInput($columns__value);
            }
        }
        if (!empty($values)) {
            $this::$db->update('tickets', $values, ['id' => $id]);
        }
        $this->response([
            'success' => true,
            'data' => [
                'id' => $id
            ]
        ]);
    }

    protected function bulkUpdate()
    {
        $tickets = $this->getInput('tickets');
        $ids = [];
        foreach($tickets as $tickets__value)
        {
            $values = [];
            foreach ( $this->colsWithout('id','user_id') as $columns__value ) {
                if (isset($tickets__value[$columns__value]) && $tickets__value[$columns__value] != '') {
                    $values[$columns__value] = $tickets__value[$columns__value];
                }
            }
            if (!empty($values) && isset($tickets__value['id'])) {
                $this::$db->update('tickets', $values, ['id' => $tickets__value['id']]);
                $ids[] = $tickets__value['id'];
            }
        }
        $this->response([
            'success' => true,
            'data' => [
                'ids' => $ids
            ]
        ]);
    }

    protected function delete($id)
    {
        $this->checkId($id);
        $this::$db->delete('tickets', ['id' => $id]);
        $this->response([
            'success' => true
        ]);
    }

    public function checkId($id)
    {
        if (
            $this::$db->fetch_var(
                'SELECT COUNT(*) FROM tickets WHERE id = ? AND user_id = ?',
                $id,
                $this::$auth->getCurrentUserId()
            ) == 0
        ) {
            $this->response(
                [
                    'success' => false,
                    'message' => 'unauthorized',
                    'public_message' => 'Nicht authentifiziert'
                ],
                401
            );
        }
    }

}
