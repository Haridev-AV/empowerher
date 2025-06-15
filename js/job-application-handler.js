// job-application-handler.js
// Handles job applications to Firebase Firestore

class JobApplicationHandler {
  constructor() {
    this.db = null;
    this.currentUser = null;
    this.userProfileData = null;
    this.init();
  }

  // Initialize Firebase connection
  init() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      this.db = firebase.firestore();
      
      // Listen for auth state changes
      firebase.auth().onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          this.loadUserProfile(user.uid);
        }
      });
    } else {
      console.error('Firebase not initialized or Firestore not available');
    }
  }

  // Load user profile data
  async loadUserProfile(userId) {
    try {
      const docRef = this.db.collection("jobseekers").doc(userId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        this.userProfileData = doc.data();
        console.log("User profile loaded for applications:", this.userProfileData);
      } else {
        console.log("No profile found for user:", userId);
        this.userProfileData = null;
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      this.userProfileData = null;
    }
  }

  // Check if user can apply to jobs
  canApplyToJobs() {
    if (!this.currentUser) {
      return { canApply: false, reason: 'not_logged_in', message: 'Please log in to apply for jobs.' };
    }

    if (!this.userProfileData) {
      return { canApply: false, reason: 'no_profile', message: 'Please create your profile before applying.' };
    }

    if (!this.userProfileData.profileComplete) {
      return { canApply: false, reason: 'incomplete_profile', message: 'Please complete your profile before applying.' };
    }

    // Check for required fields
    const requiredFields = ['firstName', 'lastName', 'contactNumber', 'skills'];
    const missingFields = requiredFields.filter(field => 
      !this.userProfileData[field] || 
      (Array.isArray(this.userProfileData[field]) && this.userProfileData[field].length === 0)
    );

    if (missingFields.length > 0) {
      return { 
        canApply: false, 
        reason: 'missing_fields', 
        message: `Please complete these profile fields: ${missingFields.join(', ')}` 
      };
    }

    return { canApply: true };
  }

  // Check if user has already applied to a specific job
  async hasAppliedToJob(jobId) {
    if (!this.currentUser) return false;

    try {
      const query = this.db.collection('applicant-post')
        .where('jobId', '==', jobId)
        .where('jobseekerId', '==', this.currentUser.uid)
        .limit(1);

      const snapshot = await query.get();
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking application status:', error);
      return false;
    }
  }

  // Get job details from Firestore
  async getJobDetails(jobId) {
    try {
      const jobDoc = await this.db.collection('jobPost').doc(jobId).get();
      
      if (jobDoc.exists) {
        return { id: jobDoc.id, ...jobDoc.data() };
      } else {
        throw new Error('Job not found');
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      throw error;
    }
  }

  // Create application document in Firestore
  async submitJobApplication(jobId) {
    try {
      // Validate user can apply
      const canApplyCheck = this.canApplyToJobs();
      if (!canApplyCheck.canApply) {
        throw new Error(canApplyCheck.message);
      }

      // Check if already applied
      const alreadyApplied = await this.hasAppliedToJob(jobId);
      if (alreadyApplied) {
        throw new Error('You have already applied to this job.');
      }

      // Get job details to extract recruiter info
      const jobDetails = await this.getJobDetails(jobId);
      
      if (!jobDetails.recruiterId) {
        throw new Error('Invalid job posting - no recruiter information found.');
      }

      // Create application data
      const applicationData = {
        // Job and recruiter references
        jobId: jobId,
        recruiterId: jobDetails.recruiterId,
        companyId: jobDetails.companyId || jobDetails.recruiterId, // Fallback to recruiterId if no companyId
        
        // Applicant references
        jobseekerId: this.currentUser.uid,
        applicantEmail: this.currentUser.email,
        
        // Application metadata
        applicationDate: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        
        // Applicant details (snapshot at time of application)
        applicantDetails: {
          firstName: this.userProfileData.firstName || '',
          lastName: this.userProfileData.lastName || '',
          fullName: `${this.userProfileData.firstName || ''} ${this.userProfileData.lastName || ''}`.trim(),
          email: this.currentUser.email,
          contactNumber: this.userProfileData.contactNumber || '',
          homeAddress: this.userProfileData.homeAddress || '',
          skills: this.userProfileData.skills || [],
          experience: this.userProfileData.experience || '',
          education: this.userProfileData.education || '',
          resumeURL: this.userProfileData.resumeURL || '',
          resumeFileName: this.userProfileData.resumeFileName || '',
          profilePictureURL: this.userProfileData.profilePictureURL || '',
          linkedinProfile: this.userProfileData.linkedinProfile || '',
          portfolioURL: this.userProfileData.portfolioURL || '',
          // Include any other relevant profile fields
          ...this.getAdditionalProfileFields()
        },
        
        // Job details (snapshot at time of application)
        jobDetails: {
          jobTitle: jobDetails.jobTitle || '',
          companyName: jobDetails.companyName || '',
          location: jobDetails.location || '',
          jobType: jobDetails.jobType || '',
          salary: jobDetails.salary || '',
          jobDescription: jobDetails.jobDescription || '',
          requirements: jobDetails.requirements || '',
          benefits: jobDetails.benefits || '',
          postedDate: jobDetails.postedDate || null
        },
        
        // Additional tracking fields
        applicationSource: 'jobseeker_dashboard',
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Submit to Firestore
      const docRef = await this.db.collection('applicant-post').add(applicationData);
      
      console.log('Application submitted with ID:', docRef.id);
      
      return {
        success: true,
        applicationId: docRef.id,
        message: `Application submitted successfully for ${jobDetails.jobTitle} at ${jobDetails.companyName}!`
      };

    } catch (error) {
      console.error('Error submitting job application:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to submit application: ${error.message}`
      };
    }
  }

  // Get additional profile fields that might be relevant for applications
  getAdditionalProfileFields() {
    const additionalFields = {};
    
    // Add any custom fields that exist in the user profile
    const optionalFields = [
      'dateOfBirth',
      'gender',
      'nationality',
      'languages',
      'certifications',
      'achievements',
      'workPreferences',
      'expectedSalary',
      'noticePeriod',
      'availability'
    ];

    optionalFields.forEach(field => {
      if (this.userProfileData[field] !== undefined) {
        additionalFields[field] = this.userProfileData[field];
      }
    });

    return additionalFields;
  }

  // Get user's applications
  async getUserApplications(limit = 10) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    try {
      const query = this.db.collection('applicant-post')
        .where('jobseekerId', '==', this.currentUser.uid)
        .limit(limit);

      const snapshot = await query.get();
      const applications = [];

      snapshot.forEach(doc => {
        applications.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort applications by date in memory
      applications.sort((a, b) => {
        const dateA = a.applicationDate?.toDate?.() || new Date(0);
        const dateB = b.applicationDate?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      return applications;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  // Update application status (for recruiters or system updates)
  async updateApplicationStatus(applicationId, newStatus, notes = '') {
    try {
      const updateData = {
        status: newStatus,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (notes) {
        updateData.recruiterNotes = notes;
        updateData.statusHistory = firebase.firestore.FieldValue.arrayUnion({
          status: newStatus,
          timestamp: new Date(),
          notes: notes
        });
      }

      await this.db.collection('applicant-post').doc(applicationId).update(updateData);
      
      return { success: true, message: 'Application status updated successfully' };
    } catch (error) {
      console.error('Error updating application status:', error);
      return { success: false, error: error.message };
    }
  }

  // Get application statistics for the user
  async getApplicationStatistics() {
    if (!this.currentUser) return null;

    try {
      const applications = await this.getUserApplications(1000); // Get all applications
      
      const stats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        reviewed: applications.filter(app => app.status === 'reviewed').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        interviews: applications.filter(app => app.status === 'interview_scheduled').length
      };

      return stats;
    } catch (error) {
      console.error('Error getting application statistics:', error);
      return null;
    }
  }

  // Withdraw application (if allowed)
  async withdrawApplication(applicationId) {
    try {
      if (!this.currentUser) {
        throw new Error('You must be logged in to withdraw an application');
      }

      // First, get the application to verify ownership and status
      const appRef = this.db.collection('applicant-post').doc(applicationId);
      const appDoc = await appRef.get();
      
      if (!appDoc.exists) {
        throw new Error('Application not found');
      }

      const appData = appDoc.data();
      
      // Verify the application belongs to the current user
      if (appData.jobseekerId !== this.currentUser.uid) {
        throw new Error('You are not authorized to withdraw this application');
      }

      // Define statuses that allow withdrawal
      const withdrawableStatuses = [
        'pending',
        'reviewed',
        'interview_scheduled',
        'interviewed',
        'shortlisted'
      ];

      // Check if current status allows withdrawal
      if (!withdrawableStatuses.includes(appData.status)) {
        if (appData.status === 'withdrawn') {
          throw new Error('This application has already been withdrawn');
        } else if (appData.status === 'accepted') {
          throw new Error('Cannot withdraw an accepted application');
        } else if (appData.status === 'rejected') {
          throw new Error('Cannot withdraw a rejected application');
        } else {
          throw new Error(`Cannot withdraw application in ${appData.status} status`);
        }
      }

      // Delete the application
      await appRef.delete();

      // Update the job application count
      const jobRef = this.db.collection('jobPost').doc(appData.jobId);
      await jobRef.update({
        applicationCount: firebase.firestore.FieldValue.increment(-1)
      });

      return { 
        success: true, 
        message: 'Application withdrawn successfully' 
      };
    } catch (error) {
      console.error('Error withdrawing application:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to withdraw application';
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to withdraw this application';
      } else if (error.code === 'not-found') {
        errorMessage = 'Application not found';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: error.code || 'unknown',
        message: errorMessage
      };
    }
  }
}

// Create global instance
const jobApplicationHandler = new JobApplicationHandler();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = JobApplicationHandler;
}