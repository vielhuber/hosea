import Store from './Store';

export default class Sort {
    static initSort() {
        document
            .querySelector('.metabar')
            .insertAdjacentHTML('beforeend', '<div class="metabar__sort"></div>');
        [1, 2].forEach(step => {
            document
                .querySelector('.metabar__sort')
                .insertAdjacentHTML(
                    'beforeend',
                    '<select class="metabar__select metabar__select--sort" name="sort_' +
                        step +
                        '"><option value="">sort #' +
                        step +
                        '</option></select>'
                );
            Store.data.cols.forEach(columns__value => {
                document
                    .querySelector('.metabar__select--sort[name="sort_' + step + '"]')
                    .insertAdjacentHTML(
                        'beforeend',
                        '<option value="' + columns__value + '">' + columns__value + '</option>'
                    );
            });
        });

        document.querySelector('.metabar').addEventListener('change', e => {
            if (e.target.closest('.metabar__select--sort')) {
                Sort.doSort();
            }
        });
    }

    static doSort() {
        let sort_1 = document.querySelector('.metabar__select--sort[name="sort_1"]').value,
            sort_2 = document.querySelector('.metabar__select--sort[name="sort_2"]').value,
            sorted = [
                ...document
                    .querySelector('.tickets .tickets__table-body')
                    .querySelectorAll('.tickets__entry--visible')
            ].sort((a, b) => {
                let val_a, val_b;

                if (sort_1 != '') {
                    val_a = a.querySelector('[name="' + sort_1 + '"]').value.toLowerCase();
                    val_b = b.querySelector('[name="' + sort_1 + '"]').value.toLowerCase();
                    if (sort_1 === 'date') {
                        val_a = Dates.germanDateTimeToEnglishString(val_a);
                        val_b = Dates.germanDateTimeToEnglishString(val_b);
                    }
                    if (val_a < val_b) {
                        return -1;
                    }
                    if (val_a > val_b) {
                        return 1;
                    }
                }

                if (sort_1 == '') {
                    val_a = a.querySelector('[name="status"]').value;
                    val_b = b.querySelector('[name="status"]').value;
                    if (val_a != val_b) {
                        for (let status__value of [
                            'allday',
                            'billed',
                            'done',
                            'working',
                            'scheduled',
                            'idle',
                            'roaming',
                            'recurring'
                        ]) {
                            if (val_a === status__value) {
                                return -1;
                            }
                            if (val_b === status__value) {
                                return 1;
                            }
                        }
                    }
                }

                if (sort_2 != '') {
                    val_a = a.querySelector('[name="' + sort_2 + '"]').value.toLowerCase();
                    val_b = b.querySelector('[name="' + sort_2 + '"]').value.toLowerCase();
                    if (val_a < val_b) {
                        return -1;
                    }
                    if (val_a > val_b) {
                        return 1;
                    }
                }

                val_a = Dates.germanDateTimeToEnglishString(a.querySelector('[name="date"]').value);
                val_b = Dates.germanDateTimeToEnglishString(b.querySelector('[name="date"]').value);
                if (val_a < val_b) {
                    return -1;
                }
                if (val_a > val_b) {
                    return 1;
                }

                val_a = a.querySelector('[name="priority"]').value;
                val_b = b.querySelector('[name="priority"]').value;
                if (val_a < val_b) {
                    return -1;
                }
                if (val_a > val_b) {
                    return 1;
                }

                val_a = a.getAttribute('data-id');
                val_b = b.getAttribute('data-id');
                if (val_a < val_b) {
                    return -1;
                }
                if (val_a > val_b) {
                    return 1;
                }

                return 0;
            });
        for (let i = 0; i < sorted.length; i++) {
            sorted[i].parentNode.appendChild(sorted[i]);
        }
    }
}
