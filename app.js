/**
 * OkulNot — Dinamik UI ve Sıralama Yönetimi
 */
const App = {
    activeClassId: null,
    sortField: 'name',
    sortOrder: 'asc',
    confirmCallback: null,

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderClassList();
        lucide.createIcons();
    },

    cacheDOM() {
        this.classList = document.getElementById('class-list');
        this.classContent = document.getElementById('class-content');
        this.noClassSelected = document.getElementById('no-class-selected');
        this.subjectTags = document.getElementById('subject-tags');
        this.tableHead = document.getElementById('table-head');
        this.studentList = document.getElementById('student-list');
        
        this.confirmModal = document.getElementById('confirm-modal');
        this.confirmMsg = document.getElementById('confirm-msg');
        this.confirmOkBtn = document.getElementById('confirm-ok');
        this.confirmCancelBtn = document.getElementById('confirm-cancel');
    },

    bindEvents() {
        document.getElementById('add-class-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('class-name-input');
            if (input.value.trim()) {
                const newClass = window.Storage.addClass(input.value.trim());
                input.value = '';
                this.renderClassList();
                this.selectClass(newClass.id);
            }
        });

        document.getElementById('add-subject-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('subject-name-input');
            if (input.value.trim()) {
                window.Storage.addSubject(this.activeClassId, input.value.trim());
                input.value = '';
                this.renderClassDetail();
            }
        });

        document.getElementById('add-student-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('student-name');
            window.Storage.addStudent(this.activeClassId, input.value.trim());
            input.value = '';
            this.renderClassDetail();
        });

        document.getElementById('btn-delete-class').addEventListener('click', () => {
            this.askConfirm('Sınıfı Sil?', 'Tüm dersler ve öğrenci notları silinecektir.', () => {
                window.Storage.deleteClass(this.activeClassId);
                this.activeClassId = null;
                this.renderClassList();
                this.classContent.classList.add('hidden');
                this.noClassSelected.classList.remove('hidden');
            });
        });

        document.getElementById('btn-export').addEventListener('click', () => this.exportExcel());
        
        document.getElementById('btn-copy-class').addEventListener('click', () => {
            const c = window.Storage.getData().classes.find(x => x.id === this.activeClassId);
            if (!c) return;
            const newName = prompt('Yeni sınıfın adını girin:', c.name + ' (Kopya)');
            if (newName && newName.trim()) {
                const newClass = window.Storage.duplicateClass(this.activeClassId, newName.trim());
                if (newClass) {
                    this.renderClassList();
                    this.selectClass(newClass.id);
                }
            }
        });

        this.confirmCancelBtn.addEventListener('click', () => this.closeConfirm());
        this.confirmOkBtn.addEventListener('click', () => {
            if (this.confirmCallback) this.confirmCallback();
            this.closeConfirm();
        });
    },

    askConfirm(title, msg, callback) {
        document.getElementById('confirm-title').innerText = title;
        this.confirmMsg.innerText = msg;
        this.confirmCallback = callback;
        this.confirmModal.classList.remove('hidden');
    },

    closeConfirm() {
        this.confirmModal.classList.add('hidden');
        this.confirmCallback = null;
    },

    selectClass(id) {
        this.activeClassId = id;
        this.renderClassList();
        this.classContent.classList.remove('hidden');
        this.noClassSelected.classList.add('hidden');
        this.renderClassDetail();
    },

    renderClassList() {
        const { classes } = window.Storage.getData();
        this.classList.innerHTML = '';
        classes.forEach(c => {
            const btn = document.createElement('button');
            btn.className = `w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${this.activeClassId === c.id ? 'bg-brand-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`;
            btn.innerText = c.name;
            btn.onclick = () => this.selectClass(c.id);
            this.classList.appendChild(btn);
        });
    },

    renderClassDetail() {
        const c = window.Storage.getData().classes.find(x => x.id === this.activeClassId);
        if (!c) return;

        document.getElementById('selected-class-title').innerText = c.name;

        this.subjectTags.innerHTML = '';
        c.subjects.forEach(sub => {
            const tag = document.createElement('span');
            tag.className = "flex items-center gap-1.5 bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] border border-gray-700";
            tag.innerHTML = `${sub} <button onclick="App.deleteSubject('${sub}')" class="hover:text-red-500 font-bold ml-1">×</button>`;
            this.subjectTags.appendChild(tag);
        });

        const sortedStudents = [...c.students].sort((a, b) => {
            let valA, valB;
            if (this.sortField === 'name') {
                valA = a.name.toLocaleLowerCase('tr');
                valB = b.name.toLocaleLowerCase('tr');
            } else if (this.sortField === 'total') {
                valA = Object.values(a.grades).reduce((acc, curr) => acc + curr, 0);
                valB = Object.values(b.grades).reduce((acc, curr) => acc + curr, 0);
            } else {
                valA = a.grades[this.sortField] || 0;
                valB = b.grades[this.sortField] || 0;
            }
            if (valA < valB) return this.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        let headHtml = `
            <tr>
                <th class="px-5 py-4 w-12 text-center">#</th>
                <th class="px-5 py-4 cursor-pointer hover:text-brand-400 transition select-none" onclick="App.setSort('name')">
                    Öğrenci Ad Soyad ${this.getSortIcon('name')}
                </th>`;
        
        c.subjects.forEach(sub => {
            headHtml += `
                <th class="px-5 py-4 text-center w-28 cursor-pointer hover:text-brand-400 transition select-none" onclick="App.setSort('${sub}')">
                    ${sub} ${this.getSortIcon(sub)}
                </th>`;
        });

        headHtml += `
            <th class="px-5 py-4 text-center w-28 bg-brand-500/10 text-brand-400 font-bold cursor-pointer hover:bg-brand-500/20 transition select-none" onclick="App.setSort('total')">
                TOPLAM ${this.getSortIcon('total')}
            </th>
            <th class="w-12"></th>
        </tr>`;
        
        this.tableHead.innerHTML = headHtml;

        this.studentList.innerHTML = '';
        sortedStudents.forEach((s, i) => {
            const row = document.createElement('tr');
            row.className = "group hover:bg-white/5 transition-colors";
            let rowTotal = 0;
            let gradesHtml = '';
            c.subjects.forEach(sub => {
                const g = s.grades[sub] || 0;
                rowTotal += g;
                gradesHtml += `
                    <td class="px-5 py-4 text-center">
                        <input type="number" value="${g}" onchange="App.updateGrade('${s.id}', '${sub}', this.value)" 
                        class="w-16 bg-gray-800/50 border border-gray-700/50 focus:border-brand-500 rounded-lg text-center text-xs py-2 outline-none transition" />
                    </td>`;
            });
            
            row.innerHTML = `
                <td class="px-5 py-4 text-gray-600 font-mono text-[10px] text-center">${i + 1}</td>
                <td class="px-5 py-4 font-medium text-gray-200">${s.name}</td>
                ${gradesHtml}
                <td class="px-5 py-4 text-center font-bold text-brand-400 bg-brand-500/5">${rowTotal.toFixed(2)}</td>
                <td class="px-5 py-4 text-right">
                    <button onclick="App.deleteStudent('${s.id}')" class="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </td>
            `;
            this.studentList.appendChild(row);
        });
        lucide.createIcons();
    },

    setSort(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'desc';
        }
        this.renderClassDetail();
    },

    getSortIcon(field) {
        if (this.sortField !== field) return '<span class="opacity-20 text-[10px] ml-1">↕</span>';
        return this.sortOrder === 'asc' ? '<span class="text-brand-400 ml-1">↑</span>' : '<span class="text-brand-400 ml-1">↓</span>';
    },

    deleteSubject(sub) {
        this.askConfirm('Dersi Sil?', `${sub} dersini ve tüm notlarını silmek istediğinize emin misiniz?`, () => {
            window.Storage.deleteSubject(this.activeClassId, sub);
            this.renderClassDetail();
        });
    },

    updateGrade(sid, sub, val) {
        window.Storage.updateGrade(this.activeClassId, sid, sub, val);
        this.renderClassDetail(); 
    },

    deleteStudent(sid) {
        this.askConfirm('Öğrenciyi Sil?', 'Öğrenci tüm notlarıyla birlikte silinecektir.', () => {
            window.Storage.deleteStudent(this.activeClassId, sid);
            this.renderClassDetail();
        });
    },

    async exportExcel() {
        try {
            const c = window.Storage.getData().classes.find(x => x.id === this.activeClassId);
            if (!c || c.students.length === 0) {
                alert("Dışa aktarılacak veri bulunamadı.");
                return;
            }

            const data = c.students.map((s, i) => {
                const row = { '#': i + 1, 'Öğrenci Ad Soyad': s.name };
                let total = 0;
                c.subjects.forEach(sub => {
                    row[sub] = s.grades[sub] || 0;
                    total += row[sub];
                });
                row['TOPLAM'] = total;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Not Listesi");
            
            let safeName = "Sinif_Not_Cizelgesi";
            if (c && c.name) {
                safeName = c.name.replace(/[^a-zA-Z0-9]/g, '_');
            }
            const fileName = safeName + ".xlsx";

            // YENİ YÖNTEM: Modern Tarayıcılarda "Farklı Kaydet" penceresini zorla aç (UUID sorununu çözer)
            if (window.showSaveFilePicker) {
                try {
                    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Excel Dosyası',
                            accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
                        }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return; // Başarılıysa fonksiyondan çık
                } catch (err) {
                    // Kullanıcı iptal ettiyse hata verme
                    if (err.name === 'AbortError') return;
                    console.log("FilePicker başarısız, normal yönteme dönülüyor...", err);
                }
            }
            
            // Eğer FilePicker desteklenmiyorsa standart indirme
            XLSX.writeFile(wb, fileName);
            
        } catch (error) {
            console.error("Excel export error:", error);
            alert("Excel dosyası oluşturulurken bir hata oluştu: " + error.message);
        }
    }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
