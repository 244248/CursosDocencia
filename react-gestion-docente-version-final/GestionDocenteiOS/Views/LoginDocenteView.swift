import SwiftUI

struct LoginDocenteView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var email = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    
    @State private var showMessage = false
    @State private var messageText = ""
    @State private var isError = false
    
    @State private var isLoggingIn = false
    @State private var navigateToPanel = false
    
    var body: some View {
        ZStack {
            Color(hex: institutionManager.config?.colors?.background ?? "#f8fafc")
                .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 30) {
                    // Header
                    VStack(spacing: 15) {
                        if let logoString = institutionManager.config?.logoUrl, let url = URL(string: logoString) {
                            AsyncImage(url: url) { image in
                                    image.resizable().scaledToFit()
                            } placeholder: {
                                ProgressView()
                            }
                            .frame(height: 100)
                            .clipShape(RoundedRectangle(cornerRadius: 15))
                        }
                        
                        Text(institutionManager.config?.institutionName ?? "Universidad La Salle")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        
                        Text("Bienvenido Docente")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                    }
                    .padding(.top, 40)
                    
                    // Form
                    VStack(spacing: 20) {
                        VStack(alignment: .leading) {
                            Text("Correo Electrónico")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("ejemplo@lasalle.edu.mx", text: $email)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                        }
                        
                        VStack(alignment: .leading) {
                            Text("Contraseña")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            HStack {
                                if isPasswordVisible {
                                    TextField("••••••••", text: $password)
                                } else {
                                    SecureField("••••••••", text: $password)
                                }
                                
                                Button(action: {
                                    isPasswordVisible.toggle()
                                }) {
                                    Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding()
                            .background(Color(UIColor.systemBackground))
                            .cornerRadius(8)
                            .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color.gray.opacity(0.3), lineWidth: 1))
                        }
                        
                        Button(action: handleLogin) {
                            HStack {
                                if isLoggingIn {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                } else {
                                    Text("Iniciar Sesión")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: institutionManager.config?.colors?.primary ?? "#004684"))
                            .foregroundColor(.white)
                            .cornerRadius(10)
                        }
                        .disabled(isLoggingIn || email.isEmpty || password.isEmpty)
                        
                        if showMessage {
                            Text(messageText)
                                .foregroundColor(isError ? .red : .green)
                                .font(.footnote)
                                .padding()
                                .background(isError ? Color.red.opacity(0.1) : Color.green.opacity(0.1))
                                .cornerRadius(8)
                        }
                        
                        Button(action: {
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("Volver")
                                .foregroundColor(.gray)
                                .underline()
                        }
                    }
                    .padding()
                    .background(Color(UIColor.systemBackground))
                    .cornerRadius(15)
                    .shadow(radius: 5)
                    .padding(.horizontal)
                }
            }
        }
        .navigationBarHidden(true)
        .navigationDestination(isPresented: $navigateToPanel) {
            DocentePanelView()
                .navigationBarBackButtonHidden(true)
        }
    }
    
    private func handleLogin() {
        isLoggingIn = true
        // Here we simulate the Firebase authentication logic for presentation
        // In the real implementation it would be `FirebaseManager.shared.auth.signIn(...)`
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoggingIn = false
            if email.contains("@") && password.count >= 6 {
                isError = false
                messageText = "Inicio de sesión exitoso"
                showMessage = true
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    navigateToPanel = true
                }
            } else {
                isError = true
                messageText = "Correo o contraseña incorrectos"
                showMessage = true
            }
        }
    }
}
