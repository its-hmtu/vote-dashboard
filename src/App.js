import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  Table,
  Layout,
  message,
  Modal,
  Space,
  Select,
  Card,
  Statistic,
} from "antd";
import { db, ref, set, onValue, get, off } from "./firebase";
import moment from "moment";

const { Option } = Select;
const { Content } = Layout;

function App() {
  // --- State ---
  const [candidates, setCandidates] = useState([]);
  const [adding, setAdding] = useState(false);
  const [waitingForCard, setWaitingForCard] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [votingActive, setVotingActive] = useState(false);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [form] = Form.useForm();
  const [sessionForm] = Form.useForm();
  const [votes, setVotes] = useState({});
  const [sessions, setSessions] = useState({});
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetailVisible, setSessionDetailVisible] = useState(false);

  // --- Data loading ---
  useEffect(() => {
    const candidatesRef = ref(db, "candidates");
    const configRef = ref(db, "config");
    const sessionsRef = ref(db, "sessions");
    const votesRef = ref(db, "votes");

    onValue(candidatesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setCandidates(
        Object.entries(data).map(([uid, value]) => ({
          key: uid,
          uid,
          ...value,
        }))
      );
    });

    onValue(configRef, (snapshot) => {
      const config = snapshot.val() || {};
      setVotingActive(config.voting_active || false);
      setActiveSession(config.current_session || null);
    });

    onValue(sessionsRef, (snapshot) => {
      setSessions(snapshot.val() || {});
    });

    onValue(votesRef, (snapshot) => {
      setVotes(snapshot.val() || {});
    });

    return () => {
      off(candidatesRef);
      off(configRef);
      off(sessionsRef);
      off(votesRef);
    };
  }, []);

  // --- Time remaining for active session ---
  useEffect(() => {
    if (!votingActive || !activeSession || !sessions[activeSession]) {
      setSessionTimeLeft(0);
      return;
    }
    const session = sessions[activeSession];
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const endTime = session.start_time + session.duration;
      setSessionTimeLeft(Math.max(0, endTime - now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [votingActive, activeSession, sessions]);

  // --- Start/Stop session ---
  const startVotingSession = async (values) => {
    const sessionId = `session_${Date.now()}`;
    const startTime = Math.floor(Date.now() / 1000);
    const duration = values.duration * 60; // minutes to seconds

    try {
      await set(ref(db, `sessions/${sessionId}`), {
        start_time: startTime,
        duration,
        candidates: values.candidates.reduce((obj, uid) => {
          obj[uid] = true;
          return obj;
        }, {}),
      });
      await set(ref(db, "config"), {
        current_session: sessionId,
        voting_active: true,
      });
      await set(ref(db, "mode/vote"), 1); // open vote mode
      message.success(`Voting session started for ${values.duration} minutes`);
      setSessionModalVisible(false);
    } catch (error) {
      message.error("Failed to start session: " + error.message);
    }
  };

  const stopVotingSession = async () => {
    if (!votingActive) return;
    try {
      await set(ref(db, "config"), {
        voting_active: false,
        current_session: null,
      });
      await set(ref(db, "mode/vote"), 0); // close vote mode
      message.success("Voting session stopped");
    } catch (error) {
      message.error("Failed to stop session: " + error.message);
    }
  };

  // --- Add candidate ---
  const listenForCard = () => {
    setWaitingForCard(true);
    const uidRef = ref(db, "new_user");
    const candidatesRef = ref(db, "candidates");

    const handleScan = async (snapshot) => {
      const uid = snapshot.val();
      if (!uid) return;
      const candidatesSnap = await get(candidatesRef);
      const candidates = candidatesSnap.val() || {};
      if (candidates[uid]) {
        alert("This card is already registered. Scan another.");
        await set(uidRef, null);
        return;
      }
      form.setFieldsValue({ uid });
      setWaitingForCard(false);
      off(uidRef);
    };
    onValue(uidRef, handleScan);
  };

  const handleNew = () => {
    setAdding(true);
    form.resetFields();
    set(ref(db, "mode/create"), 1); // open create mode
    listenForCard();
  };

  const handleSubmit = async (values) => {
    if (!values.uid || !values.name) return;
    await set(ref(db, `candidates/${values.uid}`), { name: values.name });
    await set(ref(db, "new_user"), null);
    await set(ref(db, "mode/create"), 0); // close create mode
    message.success("Candidate added");
    setAdding(false);
  };

  // --- Helpers ---
  const uidToName = useMemo(
    () =>
      candidates.reduce((map, c) => {
        map[c.uid] = c.name;
        return map;
      }, {}),
    [candidates]
  );

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // --- Vote counts for live session ---
  const currentVotes = votes[activeSession] || {};
  const voteCounts = {};
  Object.values(currentVotes).forEach((voteObj) => {
    // voteObj: { candidate_uid, timestamp }
    if (voteObj && voteObj.candidate_uid) {
      voteCounts[voteObj.candidate_uid] =
        (voteCounts[voteObj.candidate_uid] || 0) + 1;
    }
  });

  // --- Render ---
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        {/* Voting Status */}
        <Space
          direction="horizontal"
          style={{ width: "100%", marginBottom: 24 }}
        >
          <Card>
            <Statistic
              title="Voting Status"
              value={votingActive ? "Active" : "Inactive"}
              valueStyle={{ color: votingActive ? "#3f8600" : "#cf1322" }}
            />
          </Card>
          {votingActive && (
            <Card>
              <Statistic
                title="Time Remaining"
                value={formatTime(sessionTimeLeft)}
                suffix=" "
              />
            </Card>
          )}
        </Space>

        {/* Live Vote Count */}
        {votingActive && sessions[activeSession] && (
          <Card title="Live Vote Count" style={{ marginBottom: 24 }}>
            {Object.keys(sessions[activeSession].candidates || {}).map(
              (uid) => (
                <p key={uid}>
                  {uidToName[uid] || uid}: {voteCounts[uid] || 0} vote(s)
                </p>
              )
            )}
          </Card>
        )}

        {/* Session Control */}
        <div style={{ marginBottom: 24 }}>
          {!votingActive ? (
            <Button
              type="primary"
              onClick={() => setSessionModalVisible(true)}
              size="large"
            >
              Start Voting Session
            </Button>
          ) : (
            <Button
              type="primary"
              danger
              onClick={stopVotingSession}
              size="large"
            >
              Stop Voting Session
            </Button>
          )}
        </div>

        {/* Session Config Modal */}
        <Modal
          title="Configure Voting Session"
          open={sessionModalVisible}
          onOk={() => sessionForm.submit()}
          onCancel={() => setSessionModalVisible(false)}
          width={600}
        >
          <Form
            form={sessionForm}
            onFinish={startVotingSession}
            layout="vertical"
          >
            <Form.Item
              name="duration"
              label="Session Duration (minutes)"
              rules={[
                { required: true, message: "Please input session duration" },
              ]}
            >
              <Input type="number" min="1" max="120" />
            </Form.Item>
            <Form.Item
              name="candidates"
              label="Select Candidates"
              rules={[
                {
                  required: true,
                  message: "Please select at least 2 candidates",
                },
              ]}
            >
              <Select mode="multiple" placeholder="Select candidates">
                {candidates.map((c) => (
                  <Option key={c.uid} value={c.uid} label={c.name}>
                    {c.name} ({c.uid.substring(0, 8)}...)
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Candidates List */}
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <h3>Candidates List</h3>
            <Button type="primary" onClick={handleNew}>
              New Candidate
            </Button>
          </Space>
          <Table
            dataSource={candidates}
            columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Card UID", dataIndex: "uid" },
            ]}
            pagination={false}
            size="small"
          />
        </Space>

        {/* Session History */}
        <Space direction="vertical" style={{ width: "100%", marginTop: 32 }}>
          <h3>Session History</h3>
          <Table
            dataSource={Object.entries(sessions).map(([sessionId, session]) => {
              const voteList = Object.entries(votes[sessionId] || {});
              return {
                key: sessionId,
                sessionId,
                startTime: moment
                  .unix(session.start_time)
                  .format("YYYY-MM-DD HH:mm:ss"),
                duration: session.duration,
                voteCount: voteList.length,
              };
            })}
            columns={[
              { title: "Session ID", dataIndex: "sessionId" },
              { title: "Start Time", dataIndex: "startTime" },
              { title: "Duration (s)", dataIndex: "duration" },
              { title: "Total Votes", dataIndex: "voteCount" },
            ]}
            pagination={{ pageSize: 50 }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedSession(record.sessionId);
                setSessionDetailVisible(true);
              },
              style: { cursor: "pointer" },
            })}
          />
        </Space>

        {/* Add Candidate Modal */}
        <Modal
          title="Add New Candidate"
          open={adding}
          onCancel={() => setAdding(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item label="Card UID" name="uid" rules={[{ required: true }]}>
              <Input placeholder="Please scan your card" disabled />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Candidate Name" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={waitingForCard}
              >
                {waitingForCard ? "Waiting for card" : "Add Candidate"}
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  set(ref(db, "mode/create"), 0); // close create mode
                  set(ref(db, "new_user"), null);
                  message.info("Adding cancelled");
                  setWaitingForCard(false);
                }}
                style={{ marginLeft: 8 }}
              >
                Cancel
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Session Detail Modal */}
        <Modal
          title={`Session Details: ${selectedSession || ""}`}
          open={sessionDetailVisible}
          onCancel={() => setSessionDetailVisible(false)}
          footer={null}
          width={700}
        >
          {selectedSession && sessions[selectedSession] && (
            <>
              <p>
                <b>Start Time:</b>{" "}
                {moment
                  .unix(sessions[selectedSession].start_time)
                  .format("YYYY-MM-DD HH:mm:ss")}
              </p>
              <p>
                <b>Duration:</b> {sessions[selectedSession].duration} seconds
              </p>
              <p>
                <b>Candidates:</b>
              </p>
              <ul>
                {Object.keys(sessions[selectedSession].candidates || {}).map(
                  (uid) => (
                    <li key={uid}>{uidToName[uid] || uid}</li>
                  )
                )}
              </ul>
              <p>
                <b>Votes:</b>
              </p>
              <Table
                dataSource={Object.entries(votes[selectedSession] || {}).map(
                  ([voterUID, voteObj]) => ({
                    key: voterUID,
                    voterUID,
                    candidateName:
                      uidToName[voteObj.candidate_uid] || voteObj.candidate_uid,
                    candidateUID: voteObj.candidate_uid,
                    timestamp: voteObj.timestamp
                      ? moment
                          .unix(voteObj.timestamp)
                          .format("YYYY-MM-DD HH:mm:ss")
                      : "",
                  })
                )}
                columns={[
                  { title: "Voter UID", dataIndex: "voterUID" },
                  { title: "Candidate", dataIndex: "candidateName" },
                  { title: "Candidate UID", dataIndex: "candidateUID" },
                  { title: "Timestamp", dataIndex: "timestamp" },
                ]}
                pagination={false}
                size="small"
              />
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;
