'use strict';

//Mongoose
require('dotenv').config()
let bodyParser = require('body-parser');
const mongoose = require('mongoose');

const mySecret = process.env['MONGO_URI']

try {
  mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('db connected')
} catch (err) {
  console.log(err)
}

const { Schema } = mongoose;

const IssueSchema = new Schema({
  issue_title: {
    type: String,
    required: true,
  },
  issue_text: {
    type: String,
    required: true,
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
  updated_on: {
    type: Date,
    default: Date.now,
  },
  created_by: {
    type: String,
    required: true,
  },
  assigned_to: String,
  open: {
    type: Boolean,
    default: true,
  },
  status_text: String,

});
const Issue = mongoose.model('Issue', IssueSchema);

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  issues: [IssueSchema],
})
const Project = mongoose.model('Project', ProjectSchema);

exports.Issue = Issue;
exports.Project = Project;
// End of mongoose config


module.exports = function(app) {

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.route('/api/issues/:project')

    .get(function(req, res) {
      let project = req.params.project;

      Project
        .find({ name: project })
        .then(result => {

          if (result[0] !== undefined) {
            let issueArr = result[0].issues
            let filters = req.query

            const filteredIssue = issueArr.filter(issue => {
              for (const key in filters) {
                if (issue[key] !== filters[key]) {
                  if (issue._id.toString() === filters._id) {
                    return true;
                  } else {
                    return false
                  }
                }
              }
              return true
            })

            res.json(filteredIssue)
          }
        })
    })

    .post(async function(req, res) {
      let projectName = req.params.project;

      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = new Issue({
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
      });

      const project = await Project.findOne({ name: projectName });
      if (!project) {
        const newProject = new Project({ name: projectName });
        newProject.issues.push(newIssue);

        newProject.save()
          .then((issue) => {
            //console.log("Issue and project created: ", issue);
            res.json(newIssue);
          })
          .catch((err) => {
            res.status(500).json({ error: 'Error creating issue in a new project' });
          });
      } else {
        project.issues.push(newIssue);
        project.save()
          .then((issue) => {
            //console.log("Issue created in an existing project: ", issue);
            res.json(newIssue);
          })
          .catch((err) => {
            res.status(500).json({ error: 'Error creating issue in an existing project' });
          });
      }

    })


    .put(async function(req, res) {
      let projectName = req.params.project;

      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        !open
      ) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      const project = await Project.findOne({ name: projectName });
      if (!project) {
        return res.json({ error: "could not update", '_id': _id });
      }
      const issueData = project.issues.id(_id);
      if (!issueData) {
        return res.json({ error: "could not update", '_id': _id });
      }
      //console.log("issue data: ", issueData)

      issueData.issue_title = issue_title || issueData.issue_title;
      issueData.issue_text = issue_text || issueData.issue_text;
      issueData.created_by = created_by || issueData.created_by;
      issueData.assigned_to = assigned_to || issueData.assigned_to;
      issueData.status_text = status_text || issueData.status_text;
      issueData.updated_on = new Date();
      issueData.open = open;

      await project.save();
      //console.log("issue updated: ", issueData)
      return res.status(200).json({ result: 'successfully updated', _id: _id });
    })


    .delete(async function(req, res) {
      let projectName = req.params.project;

      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: "missing _id" });
      }
      const project = await Project.findOne({ name: projectName });
      if (!project) {
        return res.json({ error: "could not delete", '_id': _id });
      }
      const issueData = project.issues.id(_id);
      if (!issueData) {
        return res.json({ error: "could not delete", '_id': _id });
      }
      //console.log("issue to remove: ", issueData)

      Project.deleteOne(
        { name: projectName, "issues._id": _id }
      )
        .then((issue) => {
          res.status(200).json({ result: 'successfully deleted', '_id': _id });
        })
        .catch((err) => {
          res.status(500).json({ error: "could not delete", '_id': _id });
        });
    });

};
