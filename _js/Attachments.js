import Helper from './Helper';
import Html from './Html';
import Lock from './Lock';
import Store from './Store';
import Tickets from './Tickets';
import Footer from './Footer';
import Dates from './Dates';

export default class Attachments {
    static bindDownload() {
        document.querySelector('.tickets').addEventListener('click', (e) => {
            if (e.target.closest('.tickets__attachment-download')) {
                Attachments.startDownload(e.target.closest('.tickets__attachment').getAttribute('data-id'));
                e.preventDefault();
            }
        });
    }

    static startDownload(attachment_id) {
        Store.data.busy = true;
        Store.data.api
            .fetch('_api/attachments/' + attachment_id, {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' },
            })
            .then((res) => res.json())
            .catch((err) => {
                console.error(err);
            })
            .then((response) => {
                Store.data.busy = false;
                let base64 = response.data.data,
                    filename = response.data.name,
                    url = hlp.base64tourl(base64);

                let a = document.createElement('a');
                a.setAttribute('style', 'display:none');
                a.setAttribute('download', filename);
                a.setAttribute('href', url);
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            });
    }

    static bindUpload() {
        document.querySelector('.tickets').addEventListener('change', (e) => {
            if (e.target.closest('.tickets__entry input[type="file"]')) {
                Attachments.startUploadsAndBuildHtml(
                    e.target.closest('.tickets__entry').getAttribute('data-id'),
                    e.target.files
                );
            }
        });
    }

    static startUploadsAndBuildHtml(ticket_id, files) {
        Attachments.startUploads(ticket_id, files)
            .then((attachments) => {
                let el = document.querySelector(
                    '.tickets .tickets__entry[data-id="' + ticket_id + '"] input[type="file"]'
                );
                el.value = '';
                attachments.forEach((attachments__value) => {
                    el.closest('.tickets__entry')
                        .querySelector('.tickets__attachments')
                        .insertAdjacentHTML('beforeend', Html.createHtmlDownloadLine(attachments__value));
                });
            })
            .catch((error) => {
                console.error(error);
            });
    }

    static async startUploads(ticket_id, files) {
        let attachments = [];

        for (let files__value of Array.from(files)) {
            Lock.lockTicket(ticket_id);
            let attachment = await Attachments.startUpload(ticket_id, files__value);
            Lock.unlockTicket(ticket_id, true);
            if (attachment !== null) {
                attachments.push(attachment);
            }
        }

        // fetch entire doc to get newest attachment object
        await Tickets.updateLocalTicket(ticket_id);

        return attachments;
    }

    static startUpload(ticket_id, file) {
        return new Promise((resolve, reject) => {
            if (file.size / 1024 / 1024 > 5) {
                Footer.updateStatus('size gt 5 mb!', 'error');
                resolve(null);
                return;
            }
            Helper.fileToBase64(file).then((base64) => {
                Store.data.busy = true;
                Store.data.api
                    .fetch('_api/attachments', {
                        method: 'POST',
                        body: JSON.stringify({
                            name: file.name,
                            data: base64,
                            ticket_id: ticket_id,
                        }),
                        cache: 'no-cache',
                        headers: { 'content-type': 'application/json' },
                    })
                    .then((res) => res.json())
                    .catch((err) => {
                        console.error(err);
                    })
                    .then((response) => {
                        Store.data.busy = false;
                        let updated_at = Dates.time().toString();
                        Tickets.setTicketData(ticket_id, 'updated_at', updated_at);
                        Store.data.busy = true;
                        Store.data.api
                            .fetch('_api/tickets/' + ticket_id, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    updated_at: updated_at,
                                }),
                                cache: 'no-cache',
                                headers: { 'content-type': 'application/json' },
                            })
                            .then((res) => res.json())
                            .catch((err) => {
                                console.error(err);
                            })
                            .then((response) => {
                                Store.data.busy = false;
                            });

                        resolve(response.data);
                    });
            });
        });
    }

    static bindDeleteAttachment() {
        document.querySelector('.tickets').addEventListener('click', (e) => {
            if (e.target.closest('.tickets__attachment-delete')) {
                let ticket_id = e.target.closest('.tickets__entry').getAttribute('data-id');
                if (Lock.ticketIsLocked(ticket_id)) {
                    e.preventDefault();
                }
                let attachment_id = e.target.closest('.tickets__attachment').getAttribute('data-id');
                Store.data.busy = true;
                Store.data.api
                    .fetch('_api/attachments/' + attachment_id, {
                        method: 'DELETE',
                        cache: 'no-cache',
                        headers: { 'content-type': 'application/json' },
                    })
                    .then((res) => res.json())
                    .catch((err) => {
                        console.error(err);
                    })
                    .then((response) => {
                        Store.data.busy = false;
                        let updated_at = Dates.time().toString();
                        Tickets.setTicketData(ticket_id, 'updated_at', updated_at);
                        Store.data.busy = true;
                        Store.data.api
                            .fetch('_api/tickets/' + ticket_id, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    updated_at: updated_at,
                                }),
                                cache: 'no-cache',
                                headers: { 'content-type': 'application/json' },
                            })
                            .then((res) => res.json())
                            .catch((err) => {
                                console.error(err);
                            })
                            .then((response) => {
                                Store.data.busy = false;
                            });

                        e.target.closest('.tickets__attachment').remove();
                    });
                e.preventDefault();
            }
        });
    }
}
