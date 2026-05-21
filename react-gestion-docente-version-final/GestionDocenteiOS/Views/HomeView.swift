import SwiftUI

struct HomeView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    
    // For navigation
    @State private var navigateToDocenteLogin = false
    @State private var navigateToAdminLogin = false
    @State private var navigateToDeveloper = false
    
    // For animated logo
    @State private var logoPosition: CGPoint = CGPoint(x: 100, y: 100)
    let animationTimer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()
    @State private var directionX: CGFloat = 1
    @State private var directionY: CGFloat = 1
    
    var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color(hex: institutionManager.config?.colors?.primary ?? "#004684")
                    .opacity(0.1)
                    .ignoresSafeArea()
                
                // Floating animated logo
                AsyncImage(url: URL(string: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Logo_de_la_Universidad_La_Salle_sin_letras.svg/1200px-Logo_de_la_Universidad_La_Salle_sin_letras.svg.png")) { image in
                    image.resizable()
                } placeholder: {
                    ProgressView()
                }
                .frame(width: 100, height: 100)
                .opacity(0.3)
                .position(logoPosition)
                .onReceive(animationTimer) { _ in
                    let screenBounds = UIScreen.main.bounds
                    
                    var nextX = logoPosition.x + (directionX * 5)
                    var nextY = logoPosition.y + (directionY * 5)
                    
                    if nextX <= 50 || nextX >= screenBounds.width - 50 {
                        directionX *= -1
                        nextX = logoPosition.x + (directionX * 5)
                    }
                    if nextY <= 50 || nextY >= screenBounds.height - 50 {
                        directionY *= -1
                        nextY = logoPosition.y + (directionY * 5)
                    }
                    
                    logoPosition = CGPoint(x: nextX, y: nextY)
                }
                
                // Main Content
                VStack(spacing: 30) {
                    
                    // Logo Section
                    if let logoString = institutionManager.config?.logoUrl, let url = URL(string: logoString) {
                        AsyncImage(url: url) { image in
                            image.resizable().scaledToFit()
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(height: 150)
                        .clipShape(RoundedRectangle(cornerRadius: 15))
                        .shadow(radius: 5)
                    }
                    
                    VStack(spacing: 8) {
                        Text(institutionManager.config?.institutionName ?? "Universidad La Salle Nezahualcóyotl")
                            .font(.title)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                        
                        Text(institutionManager.config?.institutionSlogan ?? "Indivisa Manent")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    
                    VStack(spacing: 16) {
                        Button(action: {
                            navigateToDocenteLogin = true
                        }) {
                            HStack {
                                Image(systemName: "person.fill")
                                Text("Iniciar Sesión Docente")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: institutionManager.config?.colors?.primary ?? "#004684"))
                            .foregroundColor(.white)
                            .cornerRadius(25)
                        }
                        
                        Button(action: {
                            navigateToAdminLogin = true
                        }) {
                            HStack {
                                Image(systemName: "gearshape.fill")
                                Text("Iniciar Sesión Administrador")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: institutionManager.config?.colors?.secondary ?? "#ce0e2d"))
                            .foregroundColor(.white)
                            .cornerRadius(25)
                        }
                    }
                    .padding(.horizontal)
                    
                    Button(action: {
                        navigateToDeveloper = true
                    }) {
                        HStack {
                            Image(systemName: "terminal")
                            Text("Configuración")
                        }
                        .foregroundColor(.gray)
                        .font(.footnote)
                    }
                    .padding(.top, 20)
                }
                .padding()
                .background(Color(UIColor.systemBackground))
                .cornerRadius(20)
                .shadow(radius: 10)
                .padding()
                
            }
            .navigationDestination(isPresented: $navigateToDocenteLogin) {
                LoginDocenteView()
            }
            .navigationDestination(isPresented: $navigateToAdminLogin) {
                LoginAdminView()
            }
            .navigationDestination(isPresented: $navigateToDeveloper) {
                DeveloperPanelView()
                // Replace with appropriate view
            }
        }
    }
}

// Helper for Hex Colors
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
