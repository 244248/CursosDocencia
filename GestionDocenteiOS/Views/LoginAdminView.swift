import SwiftUI

struct LoginAdminView: View {
    @EnvironmentObject var institutionManager: InstitutionManager
    @Environment(\.presentationMode) var presentationMode
    
    @State private var isShowingRegister = false
    
    @State private var email = ""
    @State private var password = ""
    
    @State private var regEmail = ""
    @State private var regName = ""
    @State private var regLastName = ""
    @State private var regPassword = ""
    @State private var regConfirmPassword = ""
    
    @State private var isPasswordVisible = false
    @State private var isLoggingIn = false
    
    @State private var showMessage = false
    @State private var messageText = ""
    @State private var isError = false
    
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
                        
                        Text("Bienvenido Administrador")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                        
                        Text(institutionManager.config?.institutionName ?? "Universidad La Salle")
                            .font(.headline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.top, 40)
                    
                    // Form Container
                    VStack(spacing: 20) {
                        if !isShowingRegister {
                            loginForm
                        } else {
                            registerForm
                        }
                        
                        Button(action: {
                            withAnimation {
                                isShowingRegister.toggle()
                            }
                        }) {
                            Text(isShowingRegister ? "¿Ya tienes cuenta? Iniciar Sesión" : "¿No tienes cuenta? Regístrate Ahora")
                                .foregroundColor(Color(hex: institutionManager.config?.colors?.secondary ?? "#ce0e2d"))
                                .font(.footnote)
                        }
                        
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
            AdminPanelView()
                .navigationBarBackButtonHidden(true)
        }
    }
    
    var loginForm: some View {
        VStack(spacing: 15) {
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
                        ProgressView().progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Iniciar Sesión")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(hex: institutionManager.config?.colors?.secondary ?? "#ce0e2d"))
                .foregroundColor(.white)
                .cornerRadius(10)
            }
            .disabled(isLoggingIn || email.isEmpty || password.isEmpty)
        }
    }
    
    var registerForm: some View {
        VStack(spacing: 15) {
            Text("Registro Administrador")
                .font(.title3)
                .fontWeight(.bold)
            
            TextField("Correo Electrónico", text: $regEmail)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                
            TextField("Nombre", text: $regName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            TextField("Apellidos", text: $regLastName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            SecureField("Contraseña (mín 6 car.)", text: $regPassword)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            SecureField("Confirmar Contraseña", text: $regConfirmPassword)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                
            Button(action: handleRegister) {
                Text("Registrarse")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: institutionManager.config?.colors?.secondary ?? "#ce0e2d"))
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
    }
    
    private func handleLogin() {
        isLoggingIn = true
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
                messageText = "Credenciales incorrectas o no es admin"
                showMessage = true
            }
        }
    }
    
    private func handleRegister() {
        if regPassword != regConfirmPassword {
            isError = true
            messageText = "Las contraseñas no coinciden"
            showMessage = true
            return
        }
        
        isError = false
        messageText = "Registro exitoso. Ahora puedes iniciar sesión."
        showMessage = true
        isShowingRegister = false
    }
}
