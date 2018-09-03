import jwtbutler from 'jwtbutler';

export default class App
{
    constructor()
    {

        this.api = null;
        this.db = null;
        this.tickets = null;        
        this.url = null;
        this.backup = null;
        this.cols = [
            'status',
            'priority',
            'date',
            'time',
            'project',
            'description'
        ];
        this.colors = {
            'idle': '#b3e5fc',
            'done': '#fff59d',
            'billed': '#81c784',
            'recurring': '#ffeded',
            'working': '#ef9a9a',
            'delegated': '#ce93d8',
            'weekend': '#bbdefb',
            'big': '#e1bee7',
            
            'windows': '#42A5F5', 
            'mac': '#8D6E63',            
            'linux': '#9CCC65',
        };
        this.dates = null;
        this.session = null;
    }

    async init()
    {
    await this.login();
          this.initSessionVariables();
    await this.fetchTickets();
          this.buildHtml();
          this.initKeyboardNavigation();
          this.initScheduler();
          this.setupBindings();
          this.initSort();
          this.initFilter();
          this.updateColors();
          this.updateSum();
          this.textareaAutoHeight();
    }

    setupBindings()
    {
        this.bindAutoTime();
        this.bindChangeTracking();
        this.bindUpload();
        this.bindDownload();
        this.bindDeleteAttachment();
        this.bindDelete();
        this.bindSave();
        this.bindRefresh();
        this.bindCreate();
        this.bindScheduler();
    }

    login()
    {
        this.api = new jwtbutler({
            auth_server: '/_auth'
        });
        return this.api.login();
    }

    initSessionVariables()
    {
        this.session = {
            activeDay: new Date()
        };
    }

    fetchTickets()
    {
        return new Promise((resolve,reject) =>
        {
            this.api.fetch('/_api/tickets', {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                reject(err);
            }).then(response =>
            {
                this.tickets = [];
                response.data.forEach((tickets__value) =>
                {
                    tickets__value.visible = false;
                    this.tickets.push(tickets__value);
                });
                resolve();
            });
        });
    }

    buildHtml()
    {
        document.querySelector('#app').insertAdjacentHTML('beforeend',`
            <div id="meta"></div>
            <div id="tickets"></div>
            <div class="scheduler"></div>
        `);

        document.querySelector('#tickets').insertAdjacentHTML('beforeend',`
            <table class="ticket_table">
                <thead>
                    <tr></tr>
                </thead>
                <tbody>
                </tbody>
                <tfoot>
                    <tr></tr>
                </tfoot>
            </table>
            <a href="#" class="button_save">Speichern</a>
        `);
        this.cols.forEach((cols__value) =>
        {
            document.querySelector('.ticket_table thead tr').insertAdjacentHTML('beforeend','<td>'+cols__value+'</td>');
            document.querySelector('.ticket_table tfoot tr').insertAdjacentHTML('beforeend','<td>'+((cols__value=='time')?('<span class="sum"></span>'):(''))+'</td>');
        });
        document.querySelector('.ticket_table thead tr').insertAdjacentHTML('beforeend','<td>attachments</td><td>delete</td>');
        document.querySelector('.ticket_table tfoot tr').insertAdjacentHTML('beforeend','<td></td><td></td>');
        this.tickets.forEach((tickets__value) =>
        {
            document.querySelector('.ticket_table tbody').insertAdjacentHTML('beforeend',
                this.createHtmlLine(tickets__value, false)
            );
        });
    }    

    textareaAutoHeight()
    {
        document.addEventListener('keyup', (e) =>
        {
            if(e.target && e.target.tagName === 'TEXTAREA')
            {
                this.textareaSetHeight(e.target);
            }
        });
    }

    textareaSetHeight(el)
    {
        el.style.height = '5px';
        el.style.height = (el.scrollHeight)+'px';   
    }

    textareaSetVisibleHeights()
    {
        document.querySelectorAll('.ticket_entry--visible textarea').forEach((el) =>
        {
            this.textareaSetHeight(el);            
        });
    }

    getTicketData( ticket_id )
    {
        let data = null;
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.id == ticket_id )
            {
                data = tickets__value;
            }
        });
        return data;
    }

    setTicketData( ticket_id, property, value = null )
    {
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.id == ticket_id )
            {
                if( this.isObject(property) )
                {
                    Object.entries(property).forEach(([property__key, property__value]) =>
                    {
                        tickets__value[property__key] = property__value;
                    });
                }
                else
                {
                    tickets__value[property] = value;
                }
            }
        });      
    }

    createHtmlLine(ticket, visible)
    {
        let html = '';

        html += '<tr class="ticket_entry'+((visible === true)?(' ticket_entry--visible'):(''))+'" data-id="'+ticket.id+'">';

        this.cols.forEach((cols__value) =>
        {
            html += '<td>';
                html += '<textarea '+((['date','description'].includes(cols__value))?(' class="autosize"'):(''))+' name="'+cols__value+'">'+(ticket[cols__value]||'')+'</textarea>';
            html += '</td>';
        });
        
        html += `
            <td>
                <ul class="ticket_entry__attachments">`;
                if( ticket.attachments !== undefined && ticket.attachments.length > 0 )
                {
                    ticket.attachments.forEach((attachments__value, attachments__key) =>
                    {
                        html += this.createHtmlDownloadLine(attachments__value);
                    });
                }
        html += `
                </ul>

                <label class="ticket_entry__upload">
                    <input type="file" name="attachments" multiple="multiple" />
                </label>
   
            </td>
            <td>
                <a href="#" class="ticket_entry__delete">x</a>
            </td>
        </tr>
        `;
        return html;
    }

    getFilename( attachment_id )
    {
        return attachment_id.split('#')[1];
    }

    createHtmlDownloadLine( attachment )
    {
        return `
            <li class="ticket_entry__attachment" data-id="${ attachment.id }">
                <a class="ticket_entry__attachment_download" href="#" title="${ attachment.name }"></a>
                <a class="ticket_entry__attachment_delete" href="#" title="Löschen"></a>
            </li>
        `;
    }

    bindSave()
    {
        // button click
        document.querySelector('#tickets').addEventListener('click', (e) =>
        {
            if( e.target.closest('.button_save') )
            {
                this.saveTickets().then(() => { }).catch((error) => { console.error(error); });
                e.preventDefault();
            }
        });        

        // ctrl+s
        document.addEventListener('keydown', (event) =>
        {
            let focus = document.activeElement;
            if(event.ctrlKey || event.metaKey)
            {
                if(String.fromCharCode(event.which).toLowerCase() === 's')
                {
                    this.saveTickets().then(() =>
                    {
                        if( focus !== null )
                        {
                            focus.focus();
                        }
                    }).catch((error) =>
                    {
                        console.error(error);
                    });
                    event.preventDefault();
                }
            }
        });
    }


    bindRefresh()
    {
        // f5
        document.addEventListener('keydown', (event) =>
        {
            if( event.keyCode === 116 )
            {
                this.doFilter();
                event.preventDefault();
            }
        });
    }

    bindCreate()
    {
        // ctrl+d
        document.addEventListener('keydown', (event) =>
        {
            if(event.ctrlKey || event.metaKey)
            {
                if(String.fromCharCode(event.which).toLowerCase() === 'd')
                {
                    let visibleAll = document.querySelectorAll('.ticket_table tbody .ticket_entry--visible'),
                        current = visibleAll[visibleAll.length-1],
                        currentIndex = 1;
                    if( document.activeElement.closest('.ticket_entry') !== null )
                    {
                        current = document.activeElement.closest('.ticket_entry'),
                        currentIndex = this.prevAll(document.activeElement.closest('td')).length+1;
                    }
                    this.createTicket(this.getTicketData(current.getAttribute('data-id'))).then((ticket) =>
                    {
                        current.insertAdjacentHTML('afterend',this.createHtmlLine(ticket, true) );
                        current.nextElementSibling.querySelector('td:nth-child('+currentIndex+')').querySelector('input, textarea').select();
                        this.initScheduler();
                        this.updateColors();
                        this.updateSum();
                        this.updateFilter();
                        this.textareaSetVisibleHeights();
                    }).catch((error) =>
                    {
                        console.error(error);
                    }); 
                    event.preventDefault();
                }
            }
        });
    }

    bindChangeTracking()
    {
        document.querySelector('#tickets').addEventListener('input', (e) => { if( e.target.closest('.ticket_entry input, .ticket_entry textarea') )
        {
            if( e.target.hasAttribute('type') && e.target.getAttribute('type') === 'file' )
            {
                return;
            }
            e.target.closest('.ticket_entry').classList.add('ticket_entry--changed');
        }});
    }

    bindAutoTime()
    {
        document.querySelector('#tickets').addEventListener('change', (e) => { if( e.target.closest('.ticket_entry [name="date"]') )
        {
            if( e.target.value != '' )
            {
                let ticket_dates = e.target.value.split('\n'),
                    begin = null,
                    end = null;
                ticket_dates.forEach((ticket_dates__value, ticket_dates__key) =>
                {
                    if( (ticket_dates__key%2) === 0 )
                    {
                        begin = ticket_dates__value;
                    }
                    else
                    {
                        end = ticket_dates__value;
                        if( this.isDate(begin) && this.isDate(end) )
                        {
                            e.target.closest('.ticket_entry').querySelector('[name="time"]').val(
                                (Math.round((Math.abs(new Date(end) - new Date(begin))/(1000*60*60))*100)/100).toString().replace('.',',')
                            );
                        }
                    }
                });
            }
        }});
    }

    bindUpload()
    {
        document.querySelector('#tickets').addEventListener('change', (e) => { if( e.target.closest('.ticket_entry input[type="file"]') )
        {
            this.startUploads(
                e.target.closest('.ticket_entry').getAttribute('data-id'),
                e.target.files
            ).then((attachments) =>
            {
                e.target.value = '';
                attachments.forEach((attachments__value) =>
                {
                    e.target.closest('.ticket_entry').insertAdjacentHTML('beforeend',
                        this.createHtmlDownloadLine(attachments__value)
                    );
                });
            }).catch((error) =>
            {
                console.error(error);
            });
        }});
    }

    async startUploads( ticket_id, files )
    {
        let attachments = [];

        for(let files__value of Array.from(files))
        {
            this.lockTicket(ticket_id);            
            let attachment = await this.startUpload( ticket_id, files__value );
            this.unlockTicket(ticket_id, true);
            attachments.push(attachment);
        }

        // fetch entire doc to get newest attachment object
        await this.updateLocalTicket(ticket_id);

        return attachments;
    }

    startUpload( ticket_id, file )
    {
        return new Promise((resolve,reject) =>
        {
            this.filetobase64(file).then((base64) =>
            {
                this.api.fetch('/_api/attachments', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: file.name,
                        data: base64,
                        ticket_id: ticket_id
                    }),
                    cache: 'no-cache',
                    headers: { 'content-type': 'application/json' }
                }).then(res => res.json()).catch(err => {
                    console.error(err);
                }).then(response =>
                {
                    resolve(response.data);
                });
            });
        });
    }

    bindDownload()
    {
        document.querySelector('#tickets').addEventListener('click', (e) =>
        {
            if( e.target.closest('.ticket_entry__attachment_download') )
            {
                this.startDownload(
                    e.target.closest('.ticket_entry__attachment').getAttribute('data-id')
                );
                e.preventDefault();
            }
        });   
    }

    startDownload( attachment_id )
    { 
        this.api.fetch('/_api/attachments/'+attachment_id, {
            method: 'GET',
            cache: 'no-cache',
            headers: { 'content-type': 'application/json' }
        }).then(res => res.json()).catch(err => {
            console.error(err);
        }).then(response =>
        {
            let base64 = response.data.data,
                filename = response.data.name,
                url = 'data:application/octet-stream;base64,'+base64;

            let a = document.createElement('a');
            a.setAttribute('style','display:none');
            a.setAttribute('download', filename);
            a.setAttribute('href', url);
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    bindDelete()
    {
        document.querySelector('#tickets').addEventListener('click', (e) => { if( e.target.closest('.ticket_entry__delete') )
        {
            let ticket_id = e.target.closest('.ticket_entry').getAttribute('data-id');
            if( this.ticketIsLocked(ticket_id) )
            {
                e.preventDefault();
            }
            if( document.querySelectorAll('#tickets .ticket_entry').length === 1 )
            {
                alert('don\'t delete the genesis block!');
                e.preventDefault();
            }
            var result = confirm('Sind Sie sicher?');
            if( result )
            {
                this.deleteTicket( ticket_id ).then((result) =>
                {
                    e.target.closest('.ticket_entry').remove();
                    this.initScheduler();
                    this.updateSum();
                    this.updateFilter();
                }).catch((error) => { });
                e.preventDefault();
            }
            e.preventDefault();
        }});
    }

    deleteTicket( ticket_id )
    {
        return new Promise((resolve,reject) =>
        {
            this.api.fetch('/_api/tickets/'+ticket_id, {
                method: 'DELETE',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                console.error(err);
            }).then(response =>
            {
                this.tickets.forEach((tickets__value, tickets__key) =>
                {
                    if( tickets__value.id == ticket_id )
                    {
                        this.tickets.splice(tickets__key, 1);
                    }
                });
                resolve();
            });
        });
    }

    bindDeleteAttachment()
    {
        document.querySelector('#tickets').addEventListener('click', (e) => { if( e.target.closest('.ticket_entry__attachment_delete') )
        {
            if( this.ticketIsLocked(e.target.closest('.ticket_entry').getAttribute('data-id')) )
            {
                e.preventDefault();
            }
            let attachment_id = e.target.closest('.ticket_entry__attachment').getAttribute('data-id');
            this.api.fetch('/_api/attachments/'+attachment_id, {
                method: 'DELETE',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                console.error(err);
            }).then(response =>
            {
                e.target.closest('.ticket_entry__attachment').remove();
            });
            e.preventDefault();
        }});
    }

    lockTicket(ticket_id)
    {
        document.querySelector('.ticket_entry[data-id="'+ticket_id+'"]').classList.add('ticket_entry--locked');
        document.querySelector('.ticket_entry[data-id="'+ticket_id+'"]').querySelectorAll('input, textarea').forEach((el) => {
            el.setAttribute('disabled','disabled');
            el.setAttribute('readonly','readonly');
        });
    }

    unlockTicket(ticket_id, leave_changed = false)
    {
        if( leave_changed === false )
        {
            document.querySelector('.ticket_entry[data-id="'+ticket_id+'"]').classList.remove('ticket_entry--changed');
        }
        document.querySelector('.ticket_entry[data-id="'+ticket_id+'"]').classList.remove('ticket_entry--locked');
        document.querySelector('.ticket_entry[data-id="'+ticket_id+'"]').querySelectorAll('input, textarea').forEach((el) =>
        {
            el.removeAttribute('disabled');
            el.removeAttribute('readonly');
        });
    }

    ticketIsLocked(ticket_id)
    {
        if( document.querySelector('.ticket_entry[data-id="'+ticket_id+'"] .ticket_entry--locked') !== null )
        {
            return true;
        }
        return false;
    }

    saveTickets()
    {
        return new Promise((resolve, reject) =>
        {
            let changed = [];
            document.querySelectorAll('.ticket_entry--changed').forEach((el) =>
            {
                let data = {};
                this.cols.forEach((cols__value) =>
                {
                    data[cols__value] = el.querySelector('[name="'+cols__value+'"]').value;    
                });
                this.setTicketData(
                    el.getAttribute('data-id'),
                    data
                );
                this.lockTicket( el.getAttribute('data-id') );
                changed.push(
                    this.getTicketData( el.getAttribute('data-id') )
                );
            });

            this.api.fetch('/_api/tickets', {
                method: 'PUT',
                body: JSON.stringify({
                    tickets: changed
                }),
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                console.error(err);
            }).then(response =>
            {
                response.data.ids.forEach((value) =>
                {
                    this.unlockTicket(value);
                });
                this.initScheduler();
                this.updateColors();
                this.updateSum();
                this.updateFilter();
                resolve();
            });
        });
    }

    updateLocalTicket(ticket_id)
    {
        return new Promise((resolve,reject) =>
        {
            this.api.fetch('/_api/tickets/'+ticket_id, {
                method: 'GET',
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                reject(err);
            }).then(response =>
            {
                this.setTicketData(
                    ticket_id,
                    response.data
                );
                resolve();
            });
        });
    }

    removeAttachmentFromLocalTicket( ticket_id, attachment_id )
    {
        this.tickets.forEach((tickets__value) =>
        {
            if( tickets__value.id == ticket_id )
            {
                delete tickets__value._attachments[attachment_id];
            }
        });   
    }

    initKeyboardNavigation()
    {
        document.querySelector('#tickets').addEventListener('keyup', (e) =>
        {
            if( !e.target || (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') )
            {
                return;
            }
            let left = e.target.closest('td').previousElementSibling,
                right = e.target.closest('td').nextElementSibling,
                top = this.prevAll(e.target.closest('tr'), '.ticket_entry--visible')[0],
                down = this.nextAll(e.target.closest('tr'), '.ticket_entry--visible')[0],
                index = this.prevAll(e.target.closest('td')).length+1;

            // arrow right (switch)
            if( e.keyCode === 39 && right !== null && e.target.selectionEnd >= e.target.value.length )
            {
                right.querySelector('input, textarea').select();
                e.preventDefault();
            }
            // arrow left (switch)
            else if( e.keyCode === 37 && left !== null && e.target.selectionEnd <= 0 )
            {
                left.querySelector('input, textarea').select();
                e.preventDefault();
            }
            // arrow top (switch)
            else if( e.keyCode === 38 && top !== undefined && e.target.selectionEnd <= 0 )
            {
                top.querySelector('td:nth-child('+index+')').querySelector('input, textarea').select();
                e.preventDefault();
            }
            // arrow down (switch)
            else if( e.keyCode === 40 && down !== undefined && e.target.selectionEnd >= e.target.value.length )
            {
                down.querySelector('td:nth-child('+index+')').querySelector('input, textarea').select();
                e.preventDefault();
            }
        });
    }

    lastLineIsEmpty()
    {
        let empty = true;
        let last = document.querySelector('.ticket_entry:last-child');
        while( !last.classList.contains('ticket_entry--visible') && last.previousElementSibling !== null )
        {
            last = last.prev('.ticket_entry');
        }
        last.querySelector('input, textarea').each((index,el) =>
        {
            if( el.value != '' )
            {
                empty = false;    
            }
        });
        return empty;
    }

    createTicket(data = {})
    {
        return new Promise((resolve, reject) =>
        {
            let ticket = {};
            this.cols.forEach((cols__value) =>
            {
                ticket[cols__value] = data[cols__value]||null;
            });
            this.api.fetch('/_api/tickets', {
                method: 'POST',
                body: JSON.stringify(ticket),
                cache: 'no-cache',
                headers: { 'content-type': 'application/json' }
            }).then(res => res.json()).catch(err => {
                reject(err);
            }).then(response =>
            {
                ticket.id = response.data.id;
                this.tickets.push(ticket);
                resolve(ticket);
            });
        });
    }

    initScheduler()
    {
        document.querySelector('.scheduler').innerHTML = `
            <div class="scheduler__navigation">
                <span class="scheduler__navigation-week"></span>
                <a href="#" class="scheduler__navigation-next">next</a>
                <a href="#" class="scheduler__navigation-prev">prev</a>
                <a href="#" class="scheduler__navigation-today">today</a>
            </div>

            <table class="scheduler__table">
                <tbody class="scheduler__table-body">
                    <tr class="scheduler__row">
                        <td class="scheduler__cell"></td>   
                        ${Array(7).join(0).split(0).map((item, i) => `
                            <td class="scheduler__cell${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}">
                                ${this.dateFormat(this.getDayOfActiveWeek(i+1), 'D d.m.')}
                                <br/>
                                KW ${this.weekNumber(this.getDayOfActiveWeek(i+1))}
                            </td>
                        `).join('')}
                    </tr>
                    <tr class="scheduler__row">
                        <td class="scheduler__cell">Ganztätig</td>
                        ${Array(7).join(0).split(0).map((item, i) => `<td class="scheduler__cell${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}"></td>`).join('')}
                    </tr>
                    ${Array(15).join(0).split(0).map((item, j) => {
                        j=j+9;
                        return `
                            <tr class="scheduler__row">
                                <td class="scheduler__cell">${('0'+(j)).slice(-2)}&ndash;${('0'+(j+1)).slice(-2)}</td>
                                ${Array(7).join(0).split(0).map((item, i) => `
                                    <td class="
                                        scheduler__cell
                                        ${(this.sameDay(this.getDayOfActiveWeek(i+1),this.getCurrentDate())?(' scheduler__cell--curday'):(''))}
                                        ${((i<5 && ((j>=9 && j<13) || (j>=14 && j<18)))?(' scheduler__cell--main'):(''))}
                                    ">
                                    </td>
                                `).join('')}
                            </tr>
                        `
                    }).join('')}
                </tbody>
            </table>

            <div class="scheduler__appointments">
            </div>
        `;        

        this.generateDates().forEach((date__value) =>
        {
            document.querySelector('.scheduler__appointments').insertAdjacentHTML('beforeend',`
                <div class="scheduler__appointment" title="${date__value.title}" style="
                    left:${12.5*date__value.day}%;
                    top:${6.25*(date__value.begin-8)}%;
                    bottom:${100-(6.25*(date__value.end-8))}%;
                    background-color:${date__value.backgroundColor};
                ">
                    ${date__value.title}
                </div>
            `);
        });

        document.querySelector('.scheduler__navigation-week').innerHTML = `
            ${this.dateFormat( this.getDayOfActiveWeek(1), 'd. F Y' )} &ndash; ${this.dateFormat( this.getDayOfActiveWeek(7), 'd. F Y' )}
        `;
    }

    bindScheduler()
    {
        document.querySelector('.scheduler').addEventListener('click', (e) => { if( e.target.closest('.scheduler__navigation-today') )
        {
            this.session.activeDay = new Date();
            this.initScheduler();
            e.preventDefault();
        }});
        document.querySelector('.scheduler').addEventListener('click', (e) => { if( e.target.closest('.scheduler__navigation-prev') )
        {
            this.session.activeDay.setDate(this.session.activeDay.getDate()-7);
            this.initScheduler();
            e.preventDefault();
        }});
        document.querySelector('.scheduler').addEventListener('click', (e) => { if( e.target.closest('.scheduler__navigation-next') )
        {
            this.session.activeDay.setDate(this.session.activeDay.getDate()+7);
            this.initScheduler();
            e.preventDefault();
        }});
    }

    generateDates()
    {
        let dates = [];
        this.tickets.forEach((tickets__value) =>
        {
            if( this.dateIsInActiveWeek(tickets__value.date.split('\n')[0]) )
            {
                let title = tickets__value.project+'\n'+(tickets__value.description||'').substring(0,100),
                    ticket_dates = tickets__value.date.split('\n'),
                    cur = 0;
                while( ticket_dates[cur] !== undefined )
                {
                    let d1 = new Date(ticket_dates[cur]),
                        d2 = new Date(ticket_dates[cur+1]);
                    dates.push({
                        day: ((d1.getDay()+6)%7)+1,
                        begin: (d1.getHours()+(d1.getMinutes()/60))||24,
                        end: (d2.getHours()+(d2.getMinutes()/60))||24,
                        title: title,
                        backgroundColor: this.getColor(tickets__value.status)
                    });
                    cur += 2;
                }
            }   
        });
        return dates;
    }

    initFilter()
    {
        this.initUpdateFilter(false);
    }

    updateFilter()
    {
        this.initUpdateFilter(true);
    }

    initUpdateFilter(update)
    {
        let selected = {};
        if( update === true )
        {
            document.querySelectorAll('#meta #filter select').forEach((el) =>
            {
                selected[el.getAttribute('name')] = el.value;
            });
            document.querySelector('#meta #filter').remove();
        } 

        document.querySelector('#meta').insertAdjacentHTML('beforeend','<div id="filter"></div>');
        ['person', 'status', 'priority', 'date', 'project'].forEach((columns__value) =>
        {
            document.querySelector('#filter').insertAdjacentHTML('beforeend',`
                <select name="${columns__value}">
                    <option value="*">${columns__value}</option>
                </select>
            `);
            if( columns__value === 'date' )
            {
                let d = this.getCurrentDate();
                document.querySelector('#filter [name="date"]').insertAdjacentHTML('beforeend','<option selected="selected" value="'+this.dateFormat(d, 'Y-m-d')+'">_today</option>');
                d.setDate(d.getDate() + 1);
                document.querySelector('#filter [name="date"]').insertAdjacentHTML('beforeend','<option value="'+this.dateFormat(d, 'Y-m-d')+'">_tomorrow</option>');
                d.setDate(d.getDate() + 1);
                document.querySelector('#filter [name="date"]').insertAdjacentHTML('beforeend','<option value="'+this.dateFormat(d, 'Y-m-d')+'">_day after tomorrow</option>');
                d.setDate(d.getDate() - 3);
                document.querySelector('#filter [name="date"]').insertAdjacentHTML('beforeend','<option value="'+this.dateFormat(d, 'Y-m-d')+'">_yesterday</option>');
                d.setDate(d.getDate() - 1);
                document.querySelector('#filter [name="date"]').insertAdjacentHTML('beforeend','<option value="'+this.dateFormat(d, 'Y-m-d')+'">_day before yesterday</option>');

            }
            let options = [];
            this.tickets.forEach((tickets__value) =>
            {
                let options_value = tickets__value[columns__value];
                if( columns__value == 'date' && options_value != null && options_value != '' )
                {
                    options_value = options_value.substring(0,10);
                }
                if( !options.includes(options_value) )
                {
                    options.push(options_value);
                }
            });
            options.sort((a, b) =>
            {
                if( a === null ) { a = ''; } if( b === null ) { b = ''; }                
                return a.toLowerCase().localeCompare(b.toLowerCase());
            });
            options.forEach((options__value) =>
            {
                document.querySelector('#filter select[name="'+columns__value+'"]').insertAdjacentHTML('beforeend',
                    '<option value="'+options__value+'">'+options__value+'</option>'
                );
            });

        });

        if( update === true )
        {
            Object.entries(selected).forEach(([selected__key, selected__value]) =>
            {
                document.querySelector('#meta #filter [name="'+selected__key+'"]').value = selected__value;
            });
        }

        else
        {
            this.doFilter();
            document.querySelector('#meta').addEventListener('change', (e) => { if( e.target.closest('#filter select') )
            {
                this.doFilter();
            }});
        }
    }

    doFilter()
    {
        this.tickets.forEach((tickets__value) =>
        {
            let visible = true;
            document.querySelectorAll('#filter select').forEach((el) =>
            {
                let val_search = el.value,
                    val_target = tickets__value[el.getAttribute('name')];
                if( el.getAttribute('name') == 'date' && val_target !== null )
                {
                    val_target = val_target.substring(0,10);
                }
                if( val_search != '*' && val_target != val_search )
                {
                    visible = false;
                }
                /* hide billed in overview */
                if(
                    el.getAttribute('name') == 'status'
                    &&
                    val_search == '*'
                    &&
                    val_target == 'billed'
                    &&
                    (document.querySelector('#filter select[name="date"]').value == '*' || document.querySelector('#filter select[name="date"]').value == '')
                )
                {
                    visible = false;
                }                
            });
            if( visible === false && tickets__value.visible === true )
            {
                tickets__value.visible = false;
                document.querySelector('#tickets .ticket_entry[data-id="'+tickets__value.id+'"]').classList.remove('ticket_entry--visible');
            }
            else if( visible === true && tickets__value.visible === false )
            {
                tickets__value.visible = true;
                document.querySelector('#tickets .ticket_entry[data-id="'+tickets__value.id+'"]').classList.add('ticket_entry--visible');
            }                    
        });
        this.doSort();
        this.updateSum();
        this.textareaSetVisibleHeights();
    }

    initSort()
    {
        document.querySelector('#meta').insertAdjacentHTML('beforeend','<div id="sort"></div>');
        [1,2].forEach((step) =>
        {
            document.querySelector('#sort').insertAdjacentHTML('beforeend','<select name="sort_'+step+'"><option value="">sort #'+step+'</option></select>');
            this.cols.forEach((columns__value) =>
            {
                document.querySelector('#sort select[name="sort_'+step+'"]').insertAdjacentHTML('beforeend','<option value="'+columns__value+'">'+columns__value+'</option>');
            });
        });

        document.querySelector('#meta').addEventListener('change', (e) => { if( e.target.closest('#sort select') )
        {
            this.doSort();
        }});
    }


    doSort()
    {
        let sort_1 = document.querySelector('#sort select[name="sort_1"]').value,
            sort_2 = document.querySelector('#sort select[name="sort_2"]').value,
            sorted = [...document.querySelectorAll('#tickets .ticket_table tbody .ticket_entry--visible')].sort((a, b) =>
            {
                if( sort_1 != '' )
                {
                    if( a.querySelector('[name="'+sort_1+'"]').value.toLowerCase() < b.querySelector('[name="'+sort_1+'"]').value.toLowerCase() ) { return -1; }
                    if( a.querySelector('[name="'+sort_1+'"]').value.toLowerCase() > b.querySelector('[name="'+sort_1+'"]').value.toLowerCase() ) { return 1; }
                }
                else if( a.querySelector('[name="status"]').value != b.querySelector('[name="status"]').value )
                {
                    for(let status__value of ['billed','done','working','scheduled','recurring','weekend','delegated','idle','big'])
                    {
                        if( a.querySelector('[name="status"]').value === status__value ) { return -1; }
                        if( b.querySelector('[name="status"]').value === status__value ) { return 1; }
                    }
                }
                if( sort_2 != '' )
                {
                    if( a.querySelector('[name="'+sort_2+'"]').value.toLowerCase() < b.querySelector('[name="'+sort_2+'"]').value.toLowerCase() ) { return -1; }
                    if( a.querySelector('[name="'+sort_2+'"]').value.toLowerCase() > b.querySelector('[name="'+sort_2+'"]').value.toLowerCase() ) { return 1; }
                }
                if( a.querySelector('[name="date"]').value < b.querySelector('[name="date"]').value ) { return -1; }
                if( a.querySelector('[name="date"]').value > b.querySelector('[name="date"]').value ) { return 1; }
                if( a.querySelector('[name="priority"]').value < b.querySelector('[name="priority"]').value ) { return -1; }
                if( a.querySelector('[name="priority"]').value > b.querySelector('[name="priority"]').value ) { return 1; }
                if( a.getAttribute('data-id') < b.getAttribute('data-id') ) { return -1; }
                if( a.getAttribute('data-id') > b.getAttribute('data-id') ) { return 1; }
                return 0;
            });
        for (let i = 0; i < sorted.length; i++)
        {
            sorted[i].parentNode.appendChild(sorted[i]);
        }
    }

    getColor(status)
    {
        let color = '#f2f2f2';
        if( status !== null && status != '' && this.colors.hasOwnProperty(status) )
        {
            color = this.colors[status];
        }
        return color;
    }

    updateColors()
    {
        this.tickets.forEach((tickets__value) =>
        {
            document.querySelector('#tickets .ticket_entry[data-id="'+tickets__value.id+'"]').style.backgroundColor = this.getColor(tickets__value.status);
        });   
    }


    updateSum()
    {
        let sum = 0;
        this.tickets.forEach((tickets__value) =>
        {
            if(
                tickets__value.visible !== false &&
                tickets__value.time !== null &&
                tickets__value.time != '' &&
                !['idle', 'done', 'billed', 'delegated'].includes(tickets__value.status)
            )
            {
                sum += parseFloat(tickets__value.time.replace(',','.'));
            }
        });
        sum = (Math.round(sum*100)/100);
        sum = sum.toString().replace('.',',');
        document.querySelector('#tickets .ticket_table tfoot .sum').textContent  = sum;
    }

    getCurrentDate()
    {
        return new Date();
    }

    getDayOfActiveWeek(shift)
    {
        return this.getDayOfWeek(shift, this.session.activeDay);
    }

    getDayOfWeek(shift, date)
    {
        let d = new Date(date),
            day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1) + (shift-1);
        return new Date(d.setDate(diff));
    }

    dateFormat(d, format)
    {
        if( format === 'D d.m.' )
        {
            return ['SO','MO','DI','MI','DO','FR','SA'][d.getDay()]+' '+('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.';
        }
        if( format === 'd. F Y' )
        {
            return ('0'+d.getDate()).slice(-2)+'. '+['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'][d.getMonth()]+' '+d.getFullYear();
        }
        if( format === 'Y-m-d' )
        {
            return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2);
        }
        return ('0'+d.getDate()).slice(-2)+'.'+('0'+(d.getMonth()+1)).slice(-2)+'.'+d.getFullYear()+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2);
    }

    dateIsInActiveWeek(d)
    {
        if( d === null || d === '' )
        {
            return false;
        }
        d = new Date(d);
        return this.sameDay( this.getDayOfWeek(1, d), this.getDayOfActiveWeek(1) );
    }

    sameDay(d1, d2)
    {
        return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    weekNumber(d)
    {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        let dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    }

    filetobase64(file)
    {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });
    }

    prevAll(el, selector = null)
    {
        let prev = true;
        return [].filter.call(el.parentNode.children, (htmlElement) =>
        {
            if( htmlElement === el )
            {
                prev = false;
                return false;
            }
            if( selector !== null && !htmlElement.classList.contains(selector.replace('.','')) )
            {
                return false;
            }
            return prev;
        }).reverse();
    }

    nextAll(el, selector = null)
    {
        let next = false;
        return [].filter.call(el.parentNode.children, (htmlElement) =>
        {
            if( htmlElement === el )
            {
                next = true;
                return false;
            }
            if( selector !== null && !htmlElement.classList.contains(selector.replace('.','')) )
            {
                return false;
            }
            return next;
        });
    }

    isObject(obj)
    {
        return (obj !== null && typeof obj === 'object');
    }

    isDate(string)
    {
        return (new Date(string) !== 'Invalid Date') && !isNaN(new Date(string));
    }

}