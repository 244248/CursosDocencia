import SwiftUI

struct AdminPanelView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard Tab
            NavigationView {
                VStack {
                    Text("Panel Principal")
                        .font(.largeTitle)
                    Text("Resumen de estadísticas, usuarios y reportes.")
                        .foregroundColor(.gray)
                    
                    // Simulated Stats
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())]) {
                        StatCard(title: "Docentes", value: "10", icon: "person.2.fill", color: .blue)
                        StatCard(title: "Cursos", value: "24", icon: "book.fill", color: .purple)
                    }
                    .padding()
                }
                .navigationTitle("Dashboard")
                .navigationBarItems(trailing: Button("Salir") {
                    presentationMode.wrappedValue.dismiss()
                })
            }
            .tabItem {
                Image(systemName: "chart.bar.fill")
                Text("Dashboard")
            }
            .tag(0)
            
            // Manage Tab
            NavigationView {
                List {
                    Section(header: Text("Gestión")) {
                        NavigationLink(destination: Text("Gestión de Docentes")) {
                            Label("Docentes", systemImage: "person.fill")
                        }
                        NavigationLink(destination: Text("Gestión de Cursos")) {
                            Label("Cursos", systemImage: "book.fill")
                        }
                    }
                }
                .navigationTitle("Administración")
            }
            .tabItem {
                Image(systemName: "folder.fill")
                Text("Gestionar")
            }
            .tag(1)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack {
            Image(systemName: icon)
                .font(.largeTitle)
                .foregroundColor(color)
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }
}
