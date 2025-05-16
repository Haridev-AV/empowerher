document.addEventListener('DOMContentLoaded', function () {
  // Check if Firebase is loaded
  if (typeof firebase !== 'undefined') {
    // Initialize Firestore
    const db = firebase.firestore();
    console.log("DOM fully loaded, Firebase initialized");

    // Check if user is already logged in
    firebase.auth().onAuthStateChanged(function (user) {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        console.log("User is logged in:", user.email);
        // Don't automatically redirect on page load for the login page
      }
    });
  } else {
    console.error("Firebase not loaded");
    document.getElementById("error-message").innerHTML = `
      <div class="alert alert-error">
        Firebase initialization failed. Please check your connection or configuration.
      </div>
    `;
  }

  // Add click event listeners to user type options
  const userTypeOptions = document.querySelectorAll('.user-type-option');
  userTypeOptions.forEach(option => {
    option.addEventListener('click', function () {
      const type = this.getAttribute('data-type');
      selectUserType(type);
    });
  });

  // Select jobseeker by default
  selectUserType('jobseeker');
});

// Extracted redirect logic to reuse in both onAuthStateChanged and login function
function redirectBasedOnUser(user, db) {
  console.log("Starting redirect process for user:", user.uid);
  
  db.collection('users').doc(user.uid).get()
    .then((doc) => {
      console.log("Firestore document retrieved:", doc.exists ? "Document exists" : "No document");
      
      if (doc.exists) {
        const userData = doc.data();
        console.log("User data retrieved:", userData);
        
        // Redirect based on user type
        if (userData.userType === 'jobseeker') {
          const redirectUrl = userData.profileComplete ? 'jobseeker-dashboard.html' : 'edit-profile-jobseeker.html';
          console.log("Redirecting jobseeker to:", redirectUrl);
          window.location.href = redirectUrl;
        } else if (userData.userType === 'recruiter') {
          const redirectUrl = userData.profileComplete ? 'recruiter-dashboard.html' : 'edit-profile-recruiter.html';
          console.log("Redirecting recruiter to:", redirectUrl);
          window.location.href = redirectUrl;
        } else {
          console.log("Unknown user type:", userData.userType);
          // Fallback redirect
          window.location.href = 'choose-role.html';
        }
      } else {
        console.log("No user data found for uid:", user.uid);
        // Create default user document when it doesn't exist
        console.log("Creating default user document");
        
        // Redirect to choose-role page to let user select their role
        window.location.href = 'choose-role.html';
      }
    }).catch((error) => {
      console.error("Error getting user data:", error);
      // Show error to user
      document.getElementById("error-message").innerHTML = `
        <div class="alert alert-error">
          Error retrieving your account information. Please try again later.
        </div>
      `;
    });
}

// Toggle between login and signup forms
function toggleForms(formToShow) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const formTitle = document.getElementById('form-title');
  const loginTitle = document.getElementById('login-title');

  if (formToShow === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }

  // Clear error messages when switching forms
  document.getElementById('error-message').innerHTML = '';
}

// Select user type function
function selectUserType(type) {
  // Update hidden input
  document.getElementById('user-type').value = type;

  // Update visual selection
  document.querySelectorAll('.user-type-option').forEach(option => {
    if (option.getAttribute('data-type') === type) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
}

function signUp() {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const userType = document.getElementById("user-type").value;
  const errorMessage = document.getElementById("error-message");

  errorMessage.innerHTML = "";

  if (!email || !password) {
    errorMessage.innerHTML = `
      <div class="alert alert-error">
        Please enter both email and password.
      </div>
    `;
    return;
  }

  console.log("Starting signup with email:", email, "and type:", userType);

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      console.log("User created with ID:", user.uid);

      return firebase.firestore().collection('users').doc(user.uid).set({
        email: email,
        userType: userType,
        profileComplete: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      console.log("User data saved to Firestore");
      errorMessage.innerHTML = `
        <div class="alert alert-success">
          Account created successfully! Redirecting...
        </div>
      `;

      setTimeout(() => {
        if (userType === 'jobseeker') {
          console.log("Redirecting new jobseeker to edit profile");
          window.location.href = 'edit-profile-jobseeker.html';
        } else {
          console.log("Redirecting new recruiter to edit profile");
          window.location.href = 'edit-profile-recruiter.html';
        }
      }, 1500);
    })
    .catch(error => {
      console.error("Signup error:", error);
      errorMessage.innerHTML = `
        <div class="alert alert-error">
          ${error.message}
        </div>
      `;
    });
}

function login() {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const errorMessage = document.getElementById("error-message");

  errorMessage.innerHTML = "";

  if (!email || !password) {
    errorMessage.innerHTML = `
      <div class="alert alert-error">
        Please enter both email and password.
      </div>
    `;
    return;
  }

  console.log("Starting login with email:", email);

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      console.log("Login successful for user:", user.uid);
      
      errorMessage.innerHTML = `
        <div class="alert alert-success">
          Login successful! Redirecting...
        </div>
      `;
      
      // Initialize Firestore here explicitly
      const db = firebase.firestore();
      
      // Add a short delay before redirecting to ensure the success message is seen
      setTimeout(() => {
        console.log("Processing redirect after login");
        redirectBasedOnUser(user, db);
      }, 1000);
    })
    .catch(error => {
      console.error("Login error:", error);
      errorMessage.innerHTML = `
        <div class="alert alert-error">
          <p>Incorrect Credentials.</p>
        </div>
      `;
    });
}