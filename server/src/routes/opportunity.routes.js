const express = require('express');
const opportunityController = require('../controllers/opportunity.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// ==========================================
// METRICS (Overall Conversion & Sourcing)
// ==========================================
router.get('/metrics', opportunityController.getMetrics);

// ==========================================
// JOB OPPORTUNITIES
// ==========================================
router.get('/jobs', opportunityController.listJobs);
router.get('/jobs/:id', opportunityController.getJobById);
router.post('/jobs', opportunityController.createJob);
router.put('/jobs/:id', opportunityController.updateJob);
router.patch('/jobs/:id/status', opportunityController.updateJobStatus);
router.post('/jobs/:id/activity', opportunityController.addJobActivity);
router.post('/jobs/:id/task', opportunityController.createJobTask);
router.patch('/jobs/:id/archive', opportunityController.toggleJobArchive);
router.delete('/jobs/:id', opportunityController.deleteJob);

// ==========================================
// FREELANCE OPPORTUNITIES
// ==========================================
router.get('/freelance', opportunityController.listFreelance);
router.get('/freelance/:id', opportunityController.getFreelanceById);
router.post('/freelance', opportunityController.createFreelance);
router.put('/freelance/:id', opportunityController.updateFreelance);
router.patch('/freelance/:id/status', opportunityController.updateFreelanceStatus);
router.post('/freelance/:id/activity', opportunityController.addFreelanceActivity);
router.post('/freelance/:id/task', opportunityController.createFreelanceTask);
router.patch('/freelance/:id/archive', opportunityController.toggleFreelanceArchive);
router.delete('/freelance/:id', opportunityController.deleteFreelance);

// ==========================================
// INTERNSHIP OPPORTUNITIES
// ==========================================
router.get('/internships', opportunityController.listInternships);
router.get('/internships/:id', opportunityController.getInternshipById);
router.post('/internships', opportunityController.createInternship);
router.put('/internships/:id', opportunityController.updateInternship);
router.patch('/internships/:id/status', opportunityController.updateInternshipStatus);
router.post('/internships/:id/activity', opportunityController.addInternshipActivity);
router.post('/internships/:id/task', opportunityController.createInternshipTask);
router.patch('/internships/:id/archive', opportunityController.toggleInternshipArchive);
router.delete('/internships/:id', opportunityController.deleteInternship);

module.exports = router;
