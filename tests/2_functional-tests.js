const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);
let id1 = "";

suite('Functional Tests', function() {
  this.timeout(5000);

  // #1
  test("Create an issue with every field: POST request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest/")
      .send({
        issue_title: "Chai test #1",
        issue_text: "Test #1 text",
        created_by: "Created by 1",
        assigned_to: "Assigned to 1",
        status_text: "Status text 1"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Chai test #1')
        assert.equal(res.body.issue_text, 'Test #1 text')
        assert.equal(res.body.created_by, 'Created by 1')
        assert.equal(res.body.assigned_to, 'Assigned to 1')
        assert.equal(res.body.status_text, 'Status text 1')
        assert.equal(res.body.open, true)
        id1 = res.body._id;
        assert.property(res.body, '_id');
        done();
      });
  });

  // #2
  test("Create an issue with only required fields: POST request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest/")
      .send({
        issue_title: "Chai test #2",
        issue_text: "Test #2 text",
        created_by: "Created by 2"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.issue_title, 'Chai test #2')
        assert.equal(res.body.issue_text, 'Test #2 text')
        assert.equal(res.body.created_by, 'Created by 2')
        assert.equal(res.body.open, true)
        assert.property(res.body, '_id');
        done();
      });
  });

  // #3
  test("Create an issue with missing required fields: POST request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .post("/api/issues/apitest/")
      .send({
        assigned_to: "Assigned to 3",
        status_text: "Status text 3"
      })
      .end(function(err, res) {
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  // #4
  test("View issues on a project: GET request to /api/issues/{project}", function(done) {
    const expectedProperties = [
      'issue_title',
      'issue_text',
      'created_on',
      'updated_on',
      'created_by',
      'assigned_to',
      'open',
      'status_text',
      '_id'
    ];
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest/")
      .query({})
      .end(function(err, res) {
        assert.isArray(res.body, 'Response should be an array');
        res.body.forEach((issue) => {
          assert.property(issue, 'issue_title');
          assert.property(issue, 'issue_text');
          assert.property(issue, 'created_on');
          assert.property(issue, 'updated_on');
          assert.property(issue, 'created_by');
          assert.property(issue, 'assigned_to');
          assert.property(issue, 'open');
          assert.property(issue, 'status_text');
          assert.property(issue, '_id');
        });

        done();
      });
  });

  // #5
  test("View issues on a project with one filter: GET request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest/")
      .query({ created_by: "Javier" })
      .end(function(err, res) {
        res.body.forEach((issueResult) => {
          assert.equal(issueResult.created_by, 'Javier');
        });

        done();
      });
  });

  // #6
  test("View issues on a project with multiple filters: GET request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .get("/api/issues/apitest/")
      .query({ created_by: "Javier", issue_title: "title 1" })
      .end(function(err, res) {
        res.body.forEach((issueResult) => {
          assert.equal(issueResult.created_by, 'Javier');
          assert.equal(issueResult.issue_title, 'title 1');
        });
        done();
      });
  });

  /////////
  // #7
  test("Update one field on an issue: PUT request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/issues/apitest/")
      .send({
        _id: id1,
        issue_title: "chai test #7"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.property(res.body, '_id');
        done();
      });
  });

  // #8
  test("Update multiple fields on an issue: PUT request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/issues/apitest/")
      .send({
        _id: id1,
        issue_title: "chai test #8",
        created_by: "Javier"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.result, 'successfully updated');
        assert.property(res.body, '_id');
        done();
      });
  });

  // #9
  test("Update an issue with missing _id: PUT request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/issues/apitest/")
      .send({
        _id: '',
        issue_title: "chai test #9",
        created_by: "Javier"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, "missing _id");
        done();
      });
  });

  // #10
  test("Update an issue with no fields to update: PUT request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/issues/apitest/")
      .send({ _id: '6501cad43770b8e83c97a6fc' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, "no update field(s) sent");
        assert.property(res.body, '_id');
        done();
      });
  });

  // #11
  test("Update an issue with an invalid _id: PUT request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .put("/api/issues/apitest/")
      .send({
        _id: 'asd',
        issue_title: "chai test #11",
        created_by: "Javier"
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.error, "could not update");
        done();
      });
  });

  // #12
  test("Delete an issue: DELETE request to /api/issues/{project}",
    function(done) {
      chai
        .request(server)
        .keepOpen()
        .delete("/api/issues/apitest/")
        .send({
          _id: id1
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.result, 'successfully deleted')
          assert.equal(res.body._id, id1)
          done();
        });
    });

  // #13
  test("Delete an issue with an invalid _id: DELETE request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .delete("/api/issues/apitest/")
      .send({ _id: "123" })
      .end(function(err, res) {
        assert.equal(res.body.error, "could not delete")
        done();
      });
  });
  // #14
  test("Delete an issue with missing _id: DELETE request to /api/issues/{project}", function(done) {
    chai
      .request(server)
      .keepOpen()
      .delete("/api/issues/apitest/")
      .send({})
      .end(function(err, res) {
        assert.equal(res.body.error, "missing _id");
      });
    done();
  });


});
