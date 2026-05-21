import SwiftUI

struct DeveloperPanelView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var password = ""
    @State private var isAuthenticated = false
    
    @State private var institutionName: String = ""
    @State private var primaryColor: String = ""
    @State private var logoUrl: String = ""
    
    var body: some View {
        NavigationView {
            VStack {
                if !isAuthenticated {
                    VStack(spacing: 20) {
                        Image(systemName: "terminal")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        Text("Modo Desarrollador")
                            .font(.title)
                        
                        SecureField("Contraseña", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .padding(.horizontal)
                        
                        Button("Entrar") {
                            if password == "dev2024" || password == "admin" {
                                isAuthenticated = true
                                loadCurrentConfig()
                            }
                        }
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .padding()
                } else {
                    Form {
                        Section(header: Text("Información Básica")) {
                            TextField("Nombre de la Institución", text: $institutionName)
                            TextField("URL del Logo", text: $logoUrl)
                        }
                        
                        Section(header: Text("Colores (Hexadecimal)")) {
                            TextField("Color Primario (#000000)", text: $primaryColor)
                        }
                        
                        Section {
                            Button("Guardar Configuración") {
                                saveConfig()
                            }
                            .foregroundColor(.white)
                            .listRowBackground(Color.blue)
                        }
                    }
                }
            }
            .navigationTitle("Ajustes Avanzados")
            .navigationBarItems(trailing: Button("Cerrar") {
                presentationMode.wrappedValue.dismiss()
            })
        }
    }
    
    private func loadCurrentConfig() {
        if let config = institutionManager.config {
            institutionName = config.institutionName
            logoUrl = config.logoUrl
            primaryColor = config.colors?.primary ?? "#004684"
        }
    }
    
    private func saveConfig() {
        // En una app real, esto actualizaría Firebase a través de InstitutionManager
        var updatedConfig = institutionManager.config
        updatedConfig?.institutionName = institutionName
        updatedConfig?.logoUrl = logoUrl
        
        // This is simplified. In real code we update the dictionary.
        if updatedConfig?.colors != nil {
            updatedConfig?.colors?.primary = primaryColor
        }
        
        institutionManager.config = updatedConfig
        presentationMode.wrappedValue.dismiss()
    }
}
