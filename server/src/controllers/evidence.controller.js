const evidenceService = require('../services/evidence/evidence.service');
const {
  evidenceQuerySchema,
  createEvidenceSchema,
  updateEvidenceSchema,
  linkEvidenceSkillSchema,
  assessSkillFromEvidenceSchema,
} = require('../schemas/evidence.schema');

class EvidenceController {
  async listEvidence(req, res, next) {
    try {
      const query = evidenceQuerySchema.parse(req.query);
      const result = await evidenceService.listEvidence(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getEvidenceById(req, res, next) {
    try {
      const evidence = await evidenceService.getEvidenceById(req.user.id, req.params.id);
      res.status(200).json({ success: true, evidence });
    } catch (err) {
      next(err);
    }
  }

  async createEvidence(req, res, next) {
    try {
      const data = createEvidenceSchema.parse(req.body);
      const evidence = await evidenceService.createEvidence(req.user.id, data);
      res.status(201).json({ success: true, evidence });
    } catch (err) {
      next(err);
    }
  }

  async updateEvidence(req, res, next) {
    try {
      const data = updateEvidenceSchema.parse(req.body);
      const evidence = await evidenceService.updateEvidence(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, evidence });
    } catch (err) {
      next(err);
    }
  }

  async deleteEvidence(req, res, next) {
    try {
      const result = await evidenceService.deleteEvidence(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async linkSkill(req, res, next) {
    try {
      const data = linkEvidenceSkillSchema.parse(req.body);
      const linked = await evidenceService.linkSkill(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, evidenceSkill: linked });
    } catch (err) {
      next(err);
    }
  }

  async unlinkSkill(req, res, next) {
    try {
      const result = await evidenceService.unlinkSkill(req.user.id, req.params.id, req.params.skillId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async assessSkill(req, res, next) {
    try {
      const data = assessSkillFromEvidenceSchema.parse(req.body);
      const result = await evidenceService.assessSkillFromEvidence(req.user.id, data);
      res.status(200).json({ success: true, userSkill: result });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EvidenceController();
