document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded");
    const form = document.getElementById("editProfileForm");
    const errorMessage = document.getElementById("error-message");

    // Form elements
    const companyName = document.getElementById("companyName");
    const address = document.getElementById("address");
    const email = document.getElementById("email");
    const website = document.getElementById("website");
    const number = document.getElementById("number");
    const industry = document.getElementById("industry");
    const companyOverview = document.getElementById("companyOverview");

    // Check if Firebase is initialized properly
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not initialized!");
        errorMessage.textContent = "Firebase initialization failed. Check console for details.";
        return;
    } else {
        console.log("Firebase is initialized");
    }

    // Function to apply floating label effect
    function applyFloatingLabels() {
        const inputs = document.querySelectorAll('.input-data input, .input-data textarea');
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                input.classList.add('has-data');
            }
            
            input.addEventListener('input', function() {
                if (this.value.trim() !== '') {
                    this.classList.add('has-data');
                } else {
                    this.classList.remove('has-data');
                }
            });
        });
    }

    // Check authentication status
    let currentUser = null;
    
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
        
        if (user) {
            currentUser = user;
            
            try {
                const docRef = firebase.firestore().collection("recruiters").doc(user.uid);
                console.log("Fetching document for:", user.uid);
                
                const doc = await docRef.get();
                
                if (doc.exists) {
                    console.log("Document data retrieved:", doc.id);
                    const data = doc.data();
                    
                    // Populate form with existing data
                    companyName.value = data.companyName || "";
                    address.value = data.address || "";
                    email.value = data.email || "";
                    website.value = data.website || "";
                    number.value = data.number || "";
                    industry.value = data.industry || "";
                    companyOverview.value = data.companyOverview || "";
                    
                    // Apply floating labels after populating data
                    applyFloatingLabels();
                    
                    console.log("Form populated with data");
                } else {
                    console.log("No existing document found for this user");
                    // User exists but document doesn't - might be first time setup
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                errorMessage.textContent = `Error loading profile: ${error.message}`;
            }
        } else {
            console.warn("User not logged in!");
            errorMessage.textContent = "You must be logged in to edit your profile.";
        }
    });

    // Handle form submission
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        console.log("Form submitted");
        
        // Reset error message
        errorMessage.textContent = "";
        
        // Validate auth state again
        const user = firebase.auth().currentUser;
        
        if (!user) {
            console.error("No user logged in during form submission");
            errorMessage.style.color = "red";
            errorMessage.textContent = "You must be logged in to update your profile.";
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('input[type="submit"]');
        const originalBtnText = submitBtn.value;
        submitBtn.value = "Updating...";
        submitBtn.disabled = true;
        
        try {
            console.log("Preparing to update profile for user:", user.uid);
            
            // Create profile data object
            const profileData = {
                companyName: companyName.value.trim(),
                address: address.value.trim(),
                email: email.value.trim(),
                website: website.value.trim(),
                number: number.value.trim(),
                industry: industry.value.trim(),
                companyOverview: companyOverview.value.trim(),
                profileComplete: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            const userProfileStatusUpdate = {
                profileComplete: true
            };
            
            console.log("Profile data to save:", profileData);
            
            // Update Firestore document with merge option
            const docRef = firebase.firestore().collection("recruiters").doc(user.uid);
            await docRef.set(profileData, { merge: true });

            console.log("Profile updated successfully");
            errorMessage.style.color = "green";
            errorMessage.textContent = "Profile updated successfully! Redirecting to dashboard...";

            setTimeout(() => {
                window.location.href = "recruiter-dashboard.html";
            }, 750);

        } catch (error) {
            console.error("Error updating profile:", error);
            errorMessage.style.color = "red";
            errorMessage.textContent = `Failed to update profile: ${error.message}`;
        } finally {
            // Reset button state
            submitBtn.value = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Apply floating labels
    applyFloatingLabels();
});