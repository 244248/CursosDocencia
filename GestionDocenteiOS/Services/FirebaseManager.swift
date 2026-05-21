import Foundation
import Firebase
import FirebaseAuth
import FirebaseFirestore
import FirebaseDatabase
import FirebaseStorage

/// Singleton class equivalent to firebase/config.js. Replaces Auth, Firestore, DB, Storage initialization.
class FirebaseManager: ObservableObject {
    static let shared = FirebaseManager()
    
    let auth: Auth
    let firestore: Firestore
    let database: Database
    let storage: Storage
    
    private init() {
        if FirebaseApp.app() == nil {
            FirebaseApp.configure()
        }
        
        self.auth = Auth.auth()
        self.firestore = Firestore.firestore()
        self.database = Database.database()
        self.storage = Storage.storage()
    }
    
    // Example wrapper for login, replaces logic in LoginAdmin/LoginDocente views or services.
    func signOut() throws {
        try auth.signOut()
    }
}
