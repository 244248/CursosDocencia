import Foundation
import Combine
import SwiftUI
import FirebaseDatabase

/// Model for the Institution Configuration
struct InstitutionConfig: Codable {
    var institutionName: String
    var institutionShortName: String
    var institutionSlogan: String
    var logoUrl: String
    
    struct Colors: Codable {
        var primary: String
        var secondary: String
        var accent: String
    }
    var colors: Colors?
    
    // Add other properties that are relevant (we simplify some for brevity)
}

/// Manager for the Institution Context (Replaces InstitutionContext.jsx & InstitutionConfigService.js)
class InstitutionManager: ObservableObject {
    @Published var config: InstitutionConfig?
    @Published var isLoading: Bool = true
    @Published var error: String? = nil
    
    private var ref: DatabaseReference = Database.database().reference(withPath: "institutionConfig")
    
    init() {
        loadConfiguration()
    }
    
    func loadConfiguration() {
        isLoading = true
        ref.observe(.value) { snapshot in
            guard let value = snapshot.value as? [String: Any] else {
                self.useDefaultConfig()
                self.isLoading = false
                return
            }
            
            do {
                let data = try JSONSerialization.data(withJSONObject: value)
                let decodedConfig = try JSONDecoder().decode(InstitutionConfig.self, from: data)
                DispatchQueue.main.async {
                    self.config = decodedConfig
                    self.isLoading = false
                }
            } catch {
                print("Error decoding config: \(error)")
                self.useDefaultConfig()
                self.isLoading = false
            }
        }
    }
    
    private func useDefaultConfig() {
        let defaultColors = InstitutionConfig.Colors(primary: "#004684", secondary: "#ce0e2d", accent: "#f59e0b")
        let defaultConfig = InstitutionConfig(
            institutionName: "Universidad La Salle Nezahualcóyotl",
            institutionShortName: "La Salle Neza",
            institutionSlogan: "Indivisa Manent",
            logoUrl: "https://lasalleneza.btl.mx/wp-content/uploads/2024/02/WhatsAppLaSalleNeza.jpg",
            colors: defaultColors
        )
        DispatchQueue.main.async {
            self.config = defaultConfig
        }
    }
}
