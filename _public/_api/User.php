<?php
namespace HoseaApi;

class User extends Api
{

    public $cols = ['id', 'email', 'password', 'ical_key'];

    public function __construct()
    {
    }

    protected function getRequest()
    {
        if (
            $this->getRequestMethod() === 'GET' &&
            $this->getRequestPathFirst() === 'users' &&
            $this->getRequestPathSecond() === null
        ) {
            return $this->show($this::$auth->getCurrentUserId());
        }
    }

    protected function show($id)
    {
        $user = $this::$db->fetch_row(
            'SELECT '.implode(',',$this->colsWithout('password')).' FROM users WHERE id = ?',
            $id
        );
        $this->response([
            'success' => true,
            'data' => $user
        ]);
    }

}
