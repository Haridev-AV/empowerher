const CLOUDINARY_CLOUD_NAME = CLOUDINARY_CONFIG.CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_CONFIG.UPLOAD_PRESET;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded for jobseeker edit profile");
    const form = document.getElementById("editProfileForm");
    const errorMessage = document.getElementById("error-message");

    // Form elements from edit-profile-jobseeker.html
    const firstNameInput = document.getElementById("firstName");
    const lastNameInput = document.getElementById("lastName");
    const homeAddressInput = document.getElementById("home");
    const linkedinInput = document.getElementById("linkedin");
    const contactNumberInput = document.getElementById("number");
    const skillsInput = document.getElementById("skills");
    const profileDescInput = document.getElementById("profile-desc");
    const resumeInput = document.getElementById("resume");

    // Upload functionality elements
    const uploadContainer = document.getElementById('upload-container');
    const progressBar = document.getElementById('upload-progress');
    const fileDisplay = document.getElementById('file-display');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');

    // Check if Firebase is initialized properly
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined' || typeof firebase.firestore === 'undefined') {
        console.error("Firebase SDKs not fully initialized!");
        errorMessage.textContent = "Firebase initialization failed. Check console for details.";
        return;
    } else {
        console.log("Firebase is initialized for jobseeker");
    }

    const db = firebase.firestore();
    // Note: We no longer need Firebase storage for resume uploads

    // Function to apply floating label effect / .has-data class
    function applyFloatingLabels() {
        const inputs = document.querySelectorAll('.input-data input, .input-data textarea');
        inputs.forEach(input => {
            // For file inputs, check if a file is selected
            if (input.type === "file") {
                if (input.files && input.files.length > 0) {
                    input.classList.add('has-data');
                } else {
                    input.classList.remove('has-data');
                }
                // Add change listener for file inputs
                input.addEventListener('change', function() {
                    if (this.files && this.files.length > 0) {
                        this.classList.add('has-data');
                    } else {
                        this.classList.remove('has-data');
                    }
                });
            } else { // For other inputs, check value
                if (input.value && input.value.trim() !== '') {
                    input.classList.add('has-data');
                } else {
                    input.classList.remove('has-data');
                }
                 input.addEventListener('input', function() {
                    if (this.value && this.value.trim() !== '') {
                        this.classList.add('has-data');
                    } else {
                        this.classList.remove('has-data');
                    }
                });
            }
        });
    }
    
    let currentUser = null;
    let existingResumeURL = null; // To store existing resume URL
    let existingCloudinaryPublicId = null; // To store Cloudinary public ID for deletion

    // Upload functionality with progress bar and file management
    function setupUploadFunctionality() {
        if (resumeInput) {
            resumeInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                
                if (file) {
                    // Validate file type
                    if (file.type !== 'application/pdf') {
                        alert('Please select a PDF file only.');
                        this.value = '';
                        resetUploadDisplay();
                        return;
                    }
                    
                    // Validate file size (e.g., max 10MB for Cloudinary free tier)
                    if (file.size > 10 * 1024 * 1024) {
                        alert('File size should be less than 10MB.');
                        this.value = '';
                        resetUploadDisplay();
                        return;
                    }
                    
                    // Start upload simulation (keeping your existing progress bar)
                    simulateUpload(file);
                }
            });
            
            // Remove file functionality
            if (removeFileBtn) {
                removeFileBtn.addEventListener('click', function() {
                    resumeInput.value = '';
                    resetUploadDisplay();
                });
            }
        }
    }

    function resetUploadDisplay() {
        if (uploadContainer) uploadContainer.classList.remove('has-file');
        if (fileDisplay) fileDisplay.classList.remove('show');
        if (progressBar) {
            progressBar.classList.remove('active');
            progressBar.style.width = '0%';
        }
    }
    
    function simulateUpload(file) {
        if (!progressBar) return;
        
        // Show progress bar
        progressBar.classList.add('active');
        progressBar.style.width = '0%';
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            
            if (progress >= 100) {
                progress = 100;
                progressBar.style.width = '100%';
                
                // Upload complete
                setTimeout(() => {
                    progressBar.classList.remove('active');
                    showFileDisplay(file);
                }, 500);
                
                clearInterval(interval);
            } else {
                progressBar.style.width = progress + '%';
            }
        }, 200);
    }
    
    function showFileDisplay(file) {
        // Show uploaded file info
        if (fileName) fileName.textContent = file.name;
        if (fileDisplay) fileDisplay.classList.add('show');
        if (uploadContainer) uploadContainer.classList.add('has-file');
    }

    // Function to upload file to Cloudinary
    async function uploadToCloudinary(file) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('resource_type', 'raw'); // For PDF files
            formData.append('folder', 'resumes'); // Optional: organize in folders

            const xhr = new XMLHttpRequest();
            
            // Don't track upload progress here - let the form submission handle it
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    resolve({
                        url: response.secure_url,
                        publicId: response.public_id,
                        originalFilename: response.original_filename
                    });
                } else {
                    reject(new Error(`Upload failed with status: ${xhr.status}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Upload failed'));
            });

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`);
            xhr.send(formData);
        });
    }

    // Function to delete old resume from Cloudinary (optional)
    async function deleteFromCloudinary(publicId) {
        try {
            // Note: Deletion requires server-side implementation due to signature requirements
            // You'll need to create an API endpoint on your server for this
            const response = await fetch('/api/delete-cloudinary-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicId })
            });
            
            if (!response.ok) {
                console.warn('Failed to delete old resume from Cloudinary');
            }
        } catch (error) {
            console.warn('Error deleting old resume:', error);
        }
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
        
        if (user) {
            currentUser = user;
            const userInitial = document.getElementById('user-initial');
            if (userInitial) {
                if (user.displayName) {
                    userInitial.textContent = user.displayName.charAt(0).toUpperCase();
                } else if (user.email) {
                    userInitial.textContent = user.email.charAt(0).toUpperCase();
                }
            }

            try {
                const docRef = db.collection("jobseekers").doc(user.uid);
                console.log("Fetching jobseeker document for:", user.uid);
                
                const doc = await docRef.get();
                
                if (doc.exists) {
                    console.log("Jobseeker document data retrieved:", doc.id);
                    const data = doc.data();
                    
                    // Populate form with existing data
                    if (firstNameInput) firstNameInput.value = data.firstName || "";
                    if (lastNameInput) lastNameInput.value = data.lastName || "";
                    if (homeAddressInput) homeAddressInput.value = data.homeAddress || "";
                    if (linkedinInput) linkedinInput.value = data.linkedin || "";
                    if (contactNumberInput) contactNumberInput.value = data.contactNumber || "";
                    if (skillsInput) skillsInput.value = data.skills ? data.skills.join(", ") : "";
                    if (profileDescInput) profileDescInput.value = data.profileDescription || "";
                    
                    // Store existing resume info
                    existingResumeURL = data.resumeURL || null;
                    existingCloudinaryPublicId = data.cloudinaryPublicId || null;

                    // Show existing resume info if available
                    if (data.resumeFileName && fileName && fileDisplay && uploadContainer) {
                        fileName.textContent = data.resumeFileName + " (current)";
                        fileDisplay.classList.add('show');
                        uploadContainer.classList.add('has-file');
                    }
                    
                    applyFloatingLabels();
                    console.log("Jobseeker form populated with data");

                } else {
                    console.log("No existing jobseeker document found for this user.");
                    applyFloatingLabels();
                }
            } catch (error) {
                console.error("Error fetching jobseeker profile data:", error);
                if (errorMessage) {
                    errorMessage.style.color = "red";
                    errorMessage.textContent = `Error loading profile: ${error.message}`;
                }
            }
        } else {
            console.warn("User not logged in!");
            if (errorMessage) {
                errorMessage.style.color = "red";
                errorMessage.textContent = "You must be logged in to edit your profile.";
            }
        }
    });

    // Form submission handler
    if (form) {
        form.addEventListener("submit", async function (e) {
            e.preventDefault();
            console.log("Jobseeker profile form submitted");
            
            if (errorMessage) errorMessage.textContent = "";
            
            const user = firebase.auth().currentUser;
            if (!user) {
                console.error("No user logged in during form submission");
                if (errorMessage) {
                    errorMessage.style.color = "red";
                    errorMessage.textContent = "You must be logged in to update your profile.";
                }
                return;
            }

            // Check if resume is required and validate
            const hasExistingResume = existingResumeURL !== null;
            const hasNewResume = resumeInput && resumeInput.files && resumeInput.files.length > 0;
            
            if (!hasExistingResume && !hasNewResume && resumeInput && resumeInput.hasAttribute('required')) {
                alert('Please upload a resume before submitting.');
                return;
            }
            
            const submitBtn = form.querySelector('input[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.value : "Update";
            if (submitBtn) {
                submitBtn.value = "Updating...";
                submitBtn.disabled = true;
            }
            
            try {
                console.log("Preparing to update jobseeker profile for user:", user.uid);
                
                let resumeURL = existingResumeURL;
                let resumeFileName = null;
                let cloudinaryPublicId = existingCloudinaryPublicId;
                const resumeFile = resumeInput ? resumeInput.files[0] : null;

                if (resumeFile) {
                    console.log("New resume file selected:", resumeFile.name);
                    
                    try {
                        // Upload to Cloudinary
                        const uploadResult = await uploadToCloudinary(resumeFile);
                        resumeURL = uploadResult.url;
                        resumeFileName = resumeFile.name;
                        cloudinaryPublicId = uploadResult.publicId;
                        
                        console.log("Resume uploaded to Cloudinary, URL:", resumeURL);
                        
                        // Optionally delete old resume from Cloudinary
                        if (existingCloudinaryPublicId && existingCloudinaryPublicId !== cloudinaryPublicId) {
                            await deleteFromCloudinary(existingCloudinaryPublicId);
                        }
                        
                    } catch (uploadError) {
                        console.error("Error uploading to Cloudinary:", uploadError);
                        throw new Error("Failed to upload resume. Please try again.");
                    }
                } else {
                    // Get existing filename if available
                    const doc = await db.collection("jobseekers").doc(user.uid).get();
                    if (doc.exists && doc.data().resumeFileName) {
                        resumeFileName = doc.data().resumeFileName;
                    }
                    console.log("No new resume file selected. Using existing URL if available:", resumeURL);
                }
                
                // Prepare skills array
                const skillsArray = skillsInput && skillsInput.value ? 
                    skillsInput.value.split(',')
                        .map(skill => skill.trim())
                        .filter(skill => skill !== "") : [];

                const profileData = {
                    firstName: firstNameInput ? firstNameInput.value.trim() : "",
                    lastName: lastNameInput ? lastNameInput.value.trim() : "",
                    homeAddress: homeAddressInput ? homeAddressInput.value.trim() : "",
                    linkedin: linkedinInput ? linkedinInput.value.trim() : "",
                    contactNumber: contactNumberInput ? contactNumberInput.value.trim() : "",
                    skills: skillsArray,
                    profileDescription: profileDescInput ? profileDescInput.value.trim() : "",
                    profileComplete: true,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };

                if (resumeURL) {
                    profileData.resumeURL = resumeURL;
                }
                if (resumeFileName) {
                    profileData.resumeFileName = resumeFileName;
                }
                if (cloudinaryPublicId) {
                    profileData.cloudinaryPublicId = cloudinaryPublicId;
                }

                console.log("Jobseeker profile data to save:", profileData);
                
                const docRef = db.collection("jobseekers").doc(user.uid);
                await docRef.set(profileData, { merge: true });

                console.log("Jobseeker profile updated successfully");
                if (errorMessage) {
                    errorMessage.style.color = "green";
                    errorMessage.textContent = "Profile updated successfully! Redirecting to dashboard...";
                }

                setTimeout(() => {
                    window.location.href = "jobseeker-dashboard.html";
                }, 1500);

            } catch (error) {
                console.error("Error updating jobseeker profile:", error);
                if (errorMessage) {
                    errorMessage.style.color = "red";
                    errorMessage.textContent = `Failed to update profile: ${error.message}`;
                }
            } finally {
                if (submitBtn) {
                    submitBtn.value = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    // Initialize upload functionality
    setupUploadFunctionality();
    
    // Initial application of floating labels
    applyFloatingLabels();
});