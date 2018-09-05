import Store from './Store';

export default class Sort {
    static initSort() {
        document
            .querySelector('#meta')
            .insertAdjacentHTML('beforeend', '<div id="sort"></div>');
        [1, 2].forEach(step => {
            document
                .querySelector('#sort')
                .insertAdjacentHTML(
                    'beforeend',
                    '<select name="sort_' +
                        step +
                        '"><option value="">sort #' +
                        step +
                        '</option></select>'
                );
            Store.data.cols.forEach(columns__value => {
                document
                    .querySelector('#sort select[name="sort_' + step + '"]')
                    .insertAdjacentHTML(
                        'beforeend',
                        '<option value="' +
                            columns__value +
                            '">' +
                            columns__value +
                            '</option>'
                    );
            });
        });

        document.querySelector('#meta').addEventListener('change', e => {
            if (e.target.closest('#sort select')) {
                Sort.doSort();
            }
        });
    }

    static doSort() {
        let sort_1 = document.querySelector('#sort select[name="sort_1"]')
                .value,
            sort_2 = document.querySelector('#sort select[name="sort_2"]')
                .value,
            sorted = [
                ...document.querySelectorAll(
                    '#tickets .ticket_table tbody .ticket_entry--visible'
                )
            ].sort((a, b) => {
                if (sort_1 != '') {
                    if (
                        a
                            .querySelector('[name="' + sort_1 + '"]')
                            .value.toLowerCase() <
                        b
                            .querySelector('[name="' + sort_1 + '"]')
                            .value.toLowerCase()
                    ) {
                        return -1;
                    }
                    if (
                        a
                            .querySelector('[name="' + sort_1 + '"]')
                            .value.toLowerCase() >
                        b
                            .querySelector('[name="' + sort_1 + '"]')
                            .value.toLowerCase()
                    ) {
                        return 1;
                    }
                } else if (
                    a.querySelector('[name="status"]').value !=
                    b.querySelector('[name="status"]').value
                ) {
                    for (let status__value of [
                        'billed',
                        'done',
                        'working',
                        'scheduled',
                        'recurring',
                        'weekend',
                        'delegated',
                        'idle',
                        'big'
                    ]) {
                        if (
                            a.querySelector('[name="status"]').value ===
                            status__value
                        ) {
                            return -1;
                        }
                        if (
                            b.querySelector('[name="status"]').value ===
                            status__value
                        ) {
                            return 1;
                        }
                    }
                }
                if (sort_2 != '') {
                    if (
                        a
                            .querySelector('[name="' + sort_2 + '"]')
                            .value.toLowerCase() <
                        b
                            .querySelector('[name="' + sort_2 + '"]')
                            .value.toLowerCase()
                    ) {
                        return -1;
                    }
                    if (
                        a
                            .querySelector('[name="' + sort_2 + '"]')
                            .value.toLowerCase() >
                        b
                            .querySelector('[name="' + sort_2 + '"]')
                            .value.toLowerCase()
                    ) {
                        return 1;
                    }
                }
                if (
                    a.querySelector('[name="date"]').value <
                    b.querySelector('[name="date"]').value
                ) {
                    return -1;
                }
                if (
                    a.querySelector('[name="date"]').value >
                    b.querySelector('[name="date"]').value
                ) {
                    return 1;
                }
                if (
                    a.querySelector('[name="priority"]').value <
                    b.querySelector('[name="priority"]').value
                ) {
                    return -1;
                }
                if (
                    a.querySelector('[name="priority"]').value >
                    b.querySelector('[name="priority"]').value
                ) {
                    return 1;
                }
                if (a.getAttribute('data-id') < b.getAttribute('data-id')) {
                    return -1;
                }
                if (a.getAttribute('data-id') > b.getAttribute('data-id')) {
                    return 1;
                }
                return 0;
            });
        for (let i = 0; i < sorted.length; i++) {
            sorted[i].parentNode.appendChild(sorted[i]);
        }
    }
}
