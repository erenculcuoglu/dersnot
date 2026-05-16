/**
 * OkulNot — Sınıf ve Ders Bazlı Storage
 */
const Storage = {
    KEY: 'okulnot_data_v2',

    generateId(p) { return p + '_' + Math.random().toString(36).substr(2, 9); },

    getData() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : { classes: [] };
    },

    saveData(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },

    addClass(name) {
        const d = this.getData();
        const newClass = { id: this.generateId('c'), name, subjects: [], students: [] };
        d.classes.push(newClass);
        this.saveData(d);
        return newClass;
    },

    updateClassName(classId, newName) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            c.name = newName;
            this.saveData(d);
            return c;
        }
        return null;
    },

    duplicateClass(classId, newName) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            // Derin kopya (deep copy) alıyoruz ve yeni ID'ler atıyoruz
            const newClass = {
                id: this.generateId('c'),
                name: newName,
                subjects: [...c.subjects],
                students: c.students.map(s => ({
                    id: this.generateId('s'),
                    name: s.name,
                    grades: { ...s.grades }
                }))
            };
            d.classes.push(newClass);
            this.saveData(d);
            return newClass;
        }
        return null;
    },

    addSubject(classId, name) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c && !c.subjects.includes(name)) {
            c.subjects.push(name);
            // Tüm öğrencilere bu ders için 0 notu tanımla
            c.students.forEach(s => {
                if (!s.grades) s.grades = {};
                s.grades[name] = 0;
            });
            this.saveData(d);
        }
    },

    deleteSubject(classId, name) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            c.subjects = c.subjects.filter(s => s !== name);
            c.students.forEach(s => {
                if (s.grades) delete s.grades[name];
            });
            this.saveData(d);
        }
    },

    addStudent(classId, name) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            const grades = {};
            c.subjects.forEach(sub => grades[sub] = 0);
            c.students.push({ id: this.generateId('s'), name, grades });
            this.saveData(d);
        }
    },

    updateStudentName(classId, studentId, newName) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            const s = c.students.find(x => x.id === studentId);
            if (s) {
                s.name = newName;
                this.saveData(d);
            }
        }
    },

    updateGrade(classId, studentId, subject, grade) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            const s = c.students.find(x => x.id === studentId);
            if (s) {
                if (!s.grades) s.grades = {};
                s.grades[subject] = parseFloat(grade) || 0;
                this.saveData(d);
            }
        }
    },
    
    deleteClass(id) {
        const d = this.getData();
        d.classes = d.classes.filter(c => c.id !== id);
        this.saveData(d);
    },

    deleteStudent(classId, studentId) {
        const d = this.getData();
        const c = d.classes.find(x => x.id === classId);
        if (c) {
            c.students = c.students.filter(s => s.id !== studentId);
            this.saveData(d);
        }
    }
};

window.Storage = Storage;
