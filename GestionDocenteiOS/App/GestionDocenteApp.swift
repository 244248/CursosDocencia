import SwiftUI
import Firebase

@main
struct GestionDocenteApp: App {
    @StateObject private var institutionManager = InstitutionManager()
    
    init() {
        _ = FirebaseManager.shared // Initializes Firebase automatically
    }
    
    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(institutionManager)
        }
    }
}
