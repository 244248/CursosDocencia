import SwiftUI

struct DocentePanelView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    @Environment(\.presentationMode) var presentationMode
    
    var body: some View {
        NavigationView {
            List {
                Section(header: Text("Mis Cursos")) {
                    CourseRowView(title: "Introducción a la Programación", schedule: "Lun-Vie 8AM-10AM", students: 25)
                    CourseRowView(title: "Desarrollo iOS", schedule: "Mar-Jue 10AM-12PM", students: 15)
                }
            }
            .navigationTitle("Portal Docente")
            .navigationBarItems(trailing: Button("Salir") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
}

struct CourseRowView: View {
    let title: String
    let schedule: String
    let students: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.headline)
            Text(schedule)
                .font(.subheadline)
                .foregroundColor(.secondary)
            Text("\(students) Alumnos")
                .font(.caption)
                .foregroundColor(.blue)
        }
        .padding(.vertical, 4)
    }
}
