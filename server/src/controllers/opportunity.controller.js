const jobOpportunityService = require('../services/opportunities/jobOpportunity.service');
const freelanceOpportunityService = require('../services/opportunities/freelanceOpportunity.service');
const internshipOpportunityService = require('../services/opportunities/internshipOpportunity.service');
const opportunityActivityService = require('../services/opportunities/opportunityActivity.service');
const opportunityMetricsService = require('../services/opportunities/opportunityMetrics.service');
const {
  opportunityQuerySchema,
  createJobOpportunitySchema,
  updateJobOpportunitySchema,
  updateJobStatusSchema,
  createFreelanceOpportunitySchema,
  updateFreelanceOpportunitySchema,
  updateFreelanceStatusSchema,
  createInternshipOpportunitySchema,
  updateInternshipOpportunitySchema,
  updateInternshipStatusSchema,
  createActivitySchema,
  createTaskFromOpportunitySchema,
} = require('../schemas/opportunity.schema');

class OpportunityController {
  // ==========================================
  // JOB OPPORTUNITIES
  // ==========================================

  async listJobs(req, res, next) {
    try {
      const query = opportunityQuerySchema.parse(req.query);
      const result = await jobOpportunityService.listJobs(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await jobOpportunityService.getJobById(req.user.id, req.params.id);
      res.status(200).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  async createJob(req, res, next) {
    try {
      const data = createJobOpportunitySchema.parse(req.body);
      const job = await jobOpportunityService.createJob(req.user.id, data);
      res.status(201).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  async updateJob(req, res, next) {
    try {
      const data = updateJobOpportunitySchema.parse(req.body);
      const job = await jobOpportunityService.updateJob(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  async updateJobStatus(req, res, next) {
    try {
      const data = updateJobStatusSchema.parse(req.body);
      const job = await jobOpportunityService.updateStatus(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  async addJobActivity(req, res, next) {
    try {
      const data = createActivitySchema.parse(req.body);
      // Verify job ownership first
      await jobOpportunityService.getJobById(req.user.id, req.params.id);
      const activity = await opportunityActivityService.recordActivity(req.user.id, {
        ...data,
        opportunityType: 'JOB',
        opportunityId: req.params.id,
      });
      res.status(201).json({ success: true, activity });
    } catch (err) {
      next(err);
    }
  }

  async createJobTask(req, res, next) {
    try {
      const data = createTaskFromOpportunitySchema.parse(req.body);
      const task = await jobOpportunityService.createTaskFromOpportunity(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }

  async toggleJobArchive(req, res, next) {
    try {
      const job = await jobOpportunityService.toggleArchive(req.user.id, req.params.id);
      res.status(200).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const result = await jobOpportunityService.deleteJob(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // FREELANCE OPPORTUNITIES
  // ==========================================

  async listFreelance(req, res, next) {
    try {
      const query = opportunityQuerySchema.parse(req.query);
      const result = await freelanceOpportunityService.listFreelance(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getFreelanceById(req, res, next) {
    try {
      const freelance = await freelanceOpportunityService.getFreelanceById(req.user.id, req.params.id);
      res.status(200).json({ success: true, freelance });
    } catch (err) {
      next(err);
    }
  }

  async createFreelance(req, res, next) {
    try {
      const data = createFreelanceOpportunitySchema.parse(req.body);
      const freelance = await freelanceOpportunityService.createFreelance(req.user.id, data);
      res.status(201).json({ success: true, freelance });
    } catch (err) {
      next(err);
    }
  }

  async updateFreelance(req, res, next) {
    try {
      const data = updateFreelanceOpportunitySchema.parse(req.body);
      const freelance = await freelanceOpportunityService.updateFreelance(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, freelance });
    } catch (err) {
      next(err);
    }
  }

  async updateFreelanceStatus(req, res, next) {
    try {
      const data = updateFreelanceStatusSchema.parse(req.body);
      const freelance = await freelanceOpportunityService.updateStatus(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, freelance });
    } catch (err) {
      next(err);
    }
  }

  async addFreelanceActivity(req, res, next) {
    try {
      const data = createActivitySchema.parse(req.body);
      await freelanceOpportunityService.getFreelanceById(req.user.id, req.params.id);
      const activity = await opportunityActivityService.recordActivity(req.user.id, {
        ...data,
        opportunityType: 'FREELANCE',
        opportunityId: req.params.id,
      });
      res.status(201).json({ success: true, activity });
    } catch (err) {
      next(err);
    }
  }

  async createFreelanceTask(req, res, next) {
    try {
      const data = createTaskFromOpportunitySchema.parse(req.body);
      const task = await freelanceOpportunityService.createTaskFromOpportunity(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }

  async toggleFreelanceArchive(req, res, next) {
    try {
      const freelance = await freelanceOpportunityService.toggleArchive(req.user.id, req.params.id);
      res.status(200).json({ success: true, freelance });
    } catch (err) {
      next(err);
    }
  }

  async deleteFreelance(req, res, next) {
    try {
      const result = await freelanceOpportunityService.deleteFreelance(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // INTERNSHIP OPPORTUNITIES
  // ==========================================

  async listInternships(req, res, next) {
    try {
      const query = opportunityQuerySchema.parse(req.query);
      const result = await internshipOpportunityService.listInternships(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getInternshipById(req, res, next) {
    try {
      const internship = await internshipOpportunityService.getInternshipById(req.user.id, req.params.id);
      res.status(200).json({ success: true, internship });
    } catch (err) {
      next(err);
    }
  }

  async createInternship(req, res, next) {
    try {
      const data = createInternshipOpportunitySchema.parse(req.body);
      const internship = await internshipOpportunityService.createInternship(req.user.id, data);
      res.status(201).json({ success: true, internship });
    } catch (err) {
      next(err);
    }
  }

  async updateInternship(req, res, next) {
    try {
      const data = updateInternshipOpportunitySchema.parse(req.body);
      const internship = await internshipOpportunityService.updateInternship(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, internship });
    } catch (err) {
      next(err);
    }
  }

  async updateInternshipStatus(req, res, next) {
    try {
      const data = updateInternshipStatusSchema.parse(req.body);
      const internship = await internshipOpportunityService.updateStatus(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, internship });
    } catch (err) {
      next(err);
    }
  }

  async addInternshipActivity(req, res, next) {
    try {
      const data = createActivitySchema.parse(req.body);
      await internshipOpportunityService.getInternshipById(req.user.id, req.params.id);
      const activity = await opportunityActivityService.recordActivity(req.user.id, {
        ...data,
        opportunityType: 'INTERNSHIP',
        opportunityId: req.params.id,
      });
      res.status(201).json({ success: true, activity });
    } catch (err) {
      next(err);
    }
  }

  async createInternshipTask(req, res, next) {
    try {
      const data = createTaskFromOpportunitySchema.parse(req.body);
      const task = await internshipOpportunityService.createTaskFromOpportunity(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }

  async toggleInternshipArchive(req, res, next) {
    try {
      const internship = await internshipOpportunityService.toggleArchive(req.user.id, req.params.id);
      res.status(200).json({ success: true, internship });
    } catch (err) {
      next(err);
    }
  }

  async deleteInternship(req, res, next) {
    try {
      const result = await internshipOpportunityService.deleteInternship(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // METRICS & CONVERSION ENGINE
  // ==========================================

  async getMetrics(req, res, next) {
    try {
      const metrics = await opportunityMetricsService.getMetrics(req.user.id);
      res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OpportunityController();
