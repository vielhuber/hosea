import Store from './Store';

export default class Sort {
    static initSort() {
        document.querySelector('.metabar').insertAdjacentHTML('beforeend', '<div class="metabar__sort"></div>');
        [1, 2].forEach(step => {
            document
                .querySelector('.metabar__sort')
                .insertAdjacentHTML('beforeend', '<select class="metabar__select metabar__select--sort" name="sort_' + step + '"><option value="">sort #' + step + '</option></select>');
            Store.data.cols.forEach(columns__value => {
                document.querySelector('.metabar__select--sort[name="sort_' + step + '"]').insertAdjacentHTML('beforeend', '<option value="' + columns__value + '">' + columns__value + '</option>');
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
            sorted = [...document.querySelector('.tickets .tickets__table-body').querySelectorAll('.tickets__entry--visible')].sort((a, b) => {
                if (sort_1 != '') {
                    if (a.querySelector('[name="' + sort_1 + '"]').value.toLowerCase() < b.querySelector('[name="' + sort_1 + '"]').value.toLowerCase()) {
                        return -1;
                    }
                    if (a.querySelector('[name="' + sort_1 + '"]').value.toLowerCase() > b.querySelector('[name="' + sort_1 + '"]').value.toLowerCase()) {
                        return 1;
                    }
                } else if (a.querySelector('[name="status"]').value != b.querySelector('[name="status"]').value) {
                    for (let status__value of ['billed', 'done', 'working', 'scheduled', 'recurring', 'idle']) {
                        if (a.querySelector('[name="status"]').value === status__value) {
                            return -1;
                        }
                        if (b.querySelector('[name="status"]').value === status__value) {
                            return 1;
                        }
                    }
                }
                if (sort_2 != '') {
                    if (a.querySelector('[name="' + sort_2 + '"]').value.toLowerCase() < b.querySelector('[name="' + sort_2 + '"]').value.toLowerCase()) {
                        return -1;
                    }
                    if (a.querySelector('[name="' + sort_2 + '"]').value.toLowerCase() > b.querySelector('[name="' + sort_2 + '"]').value.toLowerCase()) {
                        return 1;
                    }
                }
                if (a.querySelector('[name="date"]').value < b.querySelector('[name="date"]').value) {
                    return -1;
                }
                if (a.querySelector('[name="date"]').value > b.querySelector('[name="date"]').value) {
                    return 1;
                }
                if (a.querySelector('[name="priority"]').value < b.querySelector('[name="priority"]').value) {
                    return -1;
                }
                if (a.querySelector('[name="priority"]').value > b.querySelector('[name="priority"]').value) {
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
