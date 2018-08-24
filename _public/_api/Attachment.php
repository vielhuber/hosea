<?php
namespace HoseaApi;

class Attachment extends Api
{

    public $cols = ['id', 'name', 'data', 'ticket_id'];

    public function __construct()
    {
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'attachments' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->index();
        }
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'attachments' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->show($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'POST' &&
            $this->getRequestPathFirst() === 'attachments' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->create();
        }
        if (
            $this->getRequestMethod() === 'PUT' &&
            $this->getRequestPathFirst() === 'attachments' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->update($this->getRequestPathSecond());
        }
        if (
            $this->getRequestMethod() === 'DELETE' &&
            $this->getRequestPathFirst() === 'attachments' &&
            is_numeric($this->getRequestPathSecond())
        ) {
            return $this->delete($this->getRequestPathSecond());
        }
    }

    protected function index()
    {
        $this->response([
            'success' => true,
            'data' => $this::$db->fetch_all(
                'SELECT '.implode(',',$this->colsWithout('data')).', ticket_id FROM attachments WHERE ticket_id IN (SELECT id FROM tickets WHERE user_id = ?)',
                $this::$auth->getCurrentUserId()
            )
        ]);
    }

    protected function show($id)
    {
        $this->checkId($id);
        $data = $this::$db->fetch_row(
            'SELECT '.implode(',',$this->cols).' FROM attachments WHERE id = ? AND ticket_id IN (SELECT id FROM tickets WHERE user_id = ?)',
            $id,
            $this::$auth->getCurrentUserId()
        );
        $data['data'] = base64_encode($data['data']); // base64 encode for proper json support
        $this->response([
            'success' => true,
            'data' => $data
        ]);
    }

    protected function create()
    {
        $this->Ticket->checkId($this->getInput('ticket_id'));
        $values = [];
        foreach (
            $this->colsWithout('id')
            as $columns__value
        ) {
            $values[$columns__value] = $this->getInput($columns__value);
        }
        $this::$db->insert('attachments', $values);
        $this->response([
            'success' => true
        ]);
    }

    protected function update($id)
    {
        $this->checkId($id);
        $values = [];
        foreach (
            $this->colsWithout('id','ticket_id')
            as $columns__value
        ) {
            if ($this->getInput($columns__value) !== null) {
                $values[$columns__value] = $this->getInput($columns__value);
            }
        }
        if (!empty($values)) {
            $this::$db->update('attachments', $values, ['id' => $id]);
        }
        $this->response([
            'success' => true
        ]);
    }

    protected function delete($id)
    {
        $this->checkId($id);
        $this::$db->delete('attachments', ['id' => $id]);
        $this->response([
            'success' => true
        ]);
    }

    protected function checkId($id)
    {
        if (
            $this::$db->fetch_var(
                'SELECT COUNT(*) FROM attachments WHERE id = ? AND ticket_id IN (SELECT id FROM tickets WHERE user_id = ?)',
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
