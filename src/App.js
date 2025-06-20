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
  Spin,
  Badge,
} from "antd";
import { db, ref, set, onValue, get, off, remove } from "./firebase";
import moment from "moment";

const { Option } = Select;
const { Content } = Layout;

// Helper to format seconds as hh:mm:ss
function formatSeconds(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s]
    .map((v, i) => (i === 0 && v === 0 ? null : String(v).padStart(2, "0")))
    .filter(Boolean)
    .join(":");
}

function App() {
  const [users, setUsers] = useState([]);
  const [adding, setAdding] = useState(false);
  const [waitingForCard, setWaitingForCard] = useState(false);
  const [sessions, setSessions] = useState();
  const [selectedSession, setSelectedSession] = useState(null);
  const [openSessionDetail, setOpenSessionDetail] = useState(false);
  const [sessionModal, setSessionModal] = useState(false);
  const [votingActive, setVotingActive] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [votes, setVotes] = useState({});
  const [sessionVoteCount, setSessionVoteCount] = useState(0);
  const [sessionCandidates, setSessionCandidates] = useState([]);
  const [candidateVotes, setCandidateVotes] = useState({});
  const [lastSessionId, setLastSessionId] = useState(null);
  const [lastSessionCandidates, setLastSessionCandidates] = useState([]);
  const [lastCandidateVotes, setLastCandidateVotes] = useState({});
  const [detailCandidates, setDetailCandidates] = useState([]);
  const [detailCandidateVotes, setDetailCandidateVotes] = useState({});
  const [detailSession, setDetailSession] = useState(null);
  const [notVotedCount, setNotVotedCount] = useState(0);
  const [notVotedUserCount, setNotVotedUserCount] = useState(0);
  const [notVotedUserList, setNotVotedUserList] = useState([]);
  const timerRef = React.useRef(null);

  const [form] = Form.useForm();
  const [sessionForm] = Form.useForm();

  useEffect(() => {
    const usersRef = ref(db, "users");
    const sessionsRef = ref(db, "sessions");

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userList = Object.entries(data).map(([uid, user]) => ({
        uid,
        ...user,
      }));
      setUsers(userList);
    });

    onValue(sessionsRef, async (snapshot) => {
      const data = snapshot.val() || {};
      const sessionList = await Promise.all(
        Object.entries(data).map(async ([sessionId, session]) => {
          // Fetch votes for this session
          const votesSnap = await get(ref(db, `votes/${sessionId}`));
          const votes = votesSnap.val() || {};
          return {
            sessionId,
            ...session,
            startTime: moment
              .unix(session.start_time)
              .format("YYYY-MM-DD HH:mm:ss"),
            voteCount: Object.keys(votes).length,
          };
        })
      );
      setSessions(sessionList);
    });

    onValue(ref(db, "config/current_session"), (snapshot) => {
      const currentSession = snapshot.val();
      if (currentSession) {
        setVotingActive(true);
        get(ref(db, `sessions/${currentSession}`)).then((sessionSnap) => {
          const sessionData = sessionSnap.val();
          if (sessionData) {
            setSessionTimeLeft(sessionData.duration);
          }
        });
      } else {
        setVotingActive(false);
        setSessionTimeLeft(0);
      }
    });
    return () => {
      off(ref(db, "config/current_session"));
      off(usersRef);
      off(sessionsRef);
    };
  }, []);

  const listenForCard = () => {
    setWaitingForCard(true);
    const uidRef = ref(db, "new_user");
    const usersRef = ref(db, "users");

    const handleScan = async (snapshot) => {
      const uid = snapshot.val();
      if (!uid) return;
      const usersSnap = await get(usersRef);
      const users = usersSnap.val() || {};
      if (users[uid]) {
        alert("This card is already registered.");
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

  const stopVotingSession = React.useCallback(async () => {
    if (!votingActive) return;
    try {
      const currentSessionSnap = await get(ref(db, "config/current_session"));
      const currentSession = currentSessionSnap.val();
      if (!currentSession) {
        message.warning("No active voting session to stop");
        return;
      }
      // Calculate not voted users (users who are not candidates and have not voted)
      const sessionSnap = await get(ref(db, `sessions/${currentSession}`));
      const session = sessionSnap.val() || {};
      const candidateUIDs = new Set(Object.keys(session.candidates || {}));
      const votesSnap = await get(ref(db, `votes/${currentSession}`));
      const votes = votesSnap.val() || {};
      const votedUIDs = new Set(Object.keys(votes)); // voter UIDs
      const notVotedUsers = users
        .filter((u) => !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid))
        .map((u) => u.uid);
      // Store not voted users in session data
      await set(
        ref(db, `sessions/${currentSession}/notVotedUsers`),
        notVotedUsers
      );
      await set(ref(db, `sessions/${currentSession}/status`), "stopped");
      await set(
        ref(db, `sessions/${currentSession}/end_time`),
        moment().format()
      );
      await set(
        ref(db, `sessions/${currentSession}/end_time_unix`),
        Math.floor(Date.now() / 1000)
      );
      setVotingActive(false);
      setSessionTimeLeft(0);
      setSelectedSession(null);
      await set(ref(db, "config"), {
        current_session: null,
      });
      await set(ref(db, "mode/vote"), 0); // close vote mode
      message.success("Voting session stopped");
    } catch (error) {
      message.error("Failed to stop session: " + error.message);
    }
  }, [votingActive, users]);

  useEffect(() => {
    if (votingActive && sessionTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSessionTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else if (sessionTimeLeft === 0 && votingActive) {
      stopVotingSession();
    }
    return () => clearInterval(timerRef.current);
  }, [votingActive, sessionTimeLeft, stopVotingSession]);

  const startVotingSession = async (values) => {
    if (!values.candidates || values.candidates.length < 2) {
      message.error("You must select at least 2 candidates to start voting.");
      return;
    }
    const sessionId = `session_${Date.now()}`;
    const startTime = Math.floor(Date.now() / 1000);
    const duration = values.duration * 60; // minutes to seconds

    try {
      await set(ref(db, `sessions/${sessionId}`), {
        status: "active",
        start_time: startTime,
        duration,
        candidates: values.candidates.reduce((obj, uid) => {
          obj[uid] = true;
          return obj;
        }, {}),
      });
      await set(ref(db, "config"), {
        current_session: sessionId,
      });
      await set(ref(db, "mode/vote"), 1); // open vote mode
      setSessionTimeLeft(duration); // Start timer
      setVotingActive(true);
      message.success(`Voting session started for ${values.duration} minutes`);
      setSessionModal(false);
      sessionForm.resetFields();
    } catch (error) {
      message.error("Failed to start session: " + error.message);
    }
  };

  const handleSubmit = async (values) => {
    if (!values.uid || !values.name) return;
    await set(ref(db, `users/${values.uid}`), {
      name: values.name,
      createdAt: moment().format(),
    });
    await set(ref(db, "new_user"), null);
    await set(ref(db, "mode/create"), 0); // close create mode
    alert("User added successfully");
    setAdding(false);
  };

  // Track current session and votes
  useEffect(() => {
    let votesRef, sessionRef;
    if (votingActive) {
      get(ref(db, "config/current_session")).then((snap) => {
        const sessionId = snap.val();
        if (sessionId) {
          sessionRef = ref(db, `sessions/${sessionId}`);
          onValue(sessionRef, (snapshot) => {
            const session = snapshot.val() || {};
            const candidateUIDs = new Set(
              Object.keys(session.candidates || {})
            );
            setSessionCandidates([...candidateUIDs]);
            setLastSessionCandidates([...candidateUIDs]);
            // Calculate not voted user count (users who are not candidates and have not voted)
            get(ref(db, `votes/${sessionId}`)).then((votesSnap) => {
              const votes = votesSnap.val() || {};
              const votedUIDs = new Set(Object.keys(votes)); // voter UIDs
              const notVotedUsers = users.filter(
                (u) => !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid)
              );
              setNotVotedUserCount(notVotedUsers.length);
            });
          });
          votesRef = ref(db, `votes/${sessionId}`);
          onValue(votesRef, (snapshot) => {
            const votes = snapshot.val() || {};
            const counts = {};
            Object.values(votes).forEach((vote) => {
              if (vote.candidate_uid) {
                counts[vote.candidate_uid] =
                  (counts[vote.candidate_uid] || 0) + 1;
              }
            });
            setCandidateVotes(counts);
            setLastCandidateVotes(counts);
            // Update not voted user count on vote change
            get(ref(db, `sessions/${sessionId}`)).then((sessionSnap) => {
              const session = sessionSnap.val() || {};
              const candidateUIDs = new Set(
                Object.keys(session.candidates || {})
              );
              const votedUIDs = new Set(Object.keys(votes)); // voter UIDs
              const notVotedUsers = users.filter(
                (u) => !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid)
              );
              setNotVotedUserCount(notVotedUsers.length);
            });
          });
        }
      });
    }
    return () => {
      if (votesRef) off(votesRef);
      if (sessionRef) off(sessionRef);
      setSessionCandidates([]);
      setCandidateVotes({});
      setNotVotedUserCount(0);
    };
  }, [votingActive, users]);

  // Live session vote count and not voted users update
  useEffect(() => {
    let votesRef, sessionRef;
    if (votingActive) {
      get(ref(db, "config/current_session")).then((snap) => {
        const sessionId = snap.val();
        if (sessionId) {
          // Listen for candidates
          sessionRef = ref(db, `sessions/${sessionId}`);
          onValue(sessionRef, (sessionSnap) => {
            const session = sessionSnap.val() || {};
            const candidateUIDs = Object.keys(session.candidates || {});
            setSessionCandidates(candidateUIDs);
            // Listen for votes
            votesRef = ref(db, `votes/${sessionId}`);
            onValue(votesRef, (votesSnap) => {
              const votes = votesSnap.val() || {};
              setSessionVoteCount(Object.keys(votes).length);
              // Calculate not voted users
              const votedUIDs = new Set(Object.keys(votes));
              const notVotedUsers = users.filter(
                (u) => !candidateUIDs.includes(u.uid) && !votedUIDs.has(u.uid)
              );
              setNotVotedUserCount(notVotedUsers.length);
              setNotVotedUserList(notVotedUsers);
            });
          });
        }
      });
    }
    return () => {
      if (votesRef) off(votesRef);
      if (sessionRef) off(sessionRef);
    };
  }, [votingActive, users]);

  useEffect(() => {
    let sessionRef, votesRef;
    if (openSessionDetail && selectedSession) {
      sessionRef = ref(db, `sessions/${selectedSession}`);
      onValue(sessionRef, (snapshot) => {
        const session = snapshot.val() || {};
        setDetailSession(session);
        setDetailCandidates(Object.keys(session.candidates || {}));
      });
      votesRef = ref(db, `votes/${selectedSession}`);
      onValue(votesRef, (snapshot) => {
        const votes = snapshot.val() || {};
        const counts = {};
        Object.values(votes).forEach((vote) => {
          if (vote.candidate_uid) {
            counts[vote.candidate_uid] = (counts[vote.candidate_uid] || 0) + 1;
          }
        });
        setDetailCandidateVotes(counts);
      });
    }
    return () => {
      if (sessionRef) off(sessionRef);
      if (votesRef) off(votesRef);
      setDetailSession(null);
      setDetailCandidates([]);
      setDetailCandidateVotes({});
    };
  }, [openSessionDetail, selectedSession]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        {/* Session Control */}
        <div style={{ marginBottom: 24 }}>
          {!votingActive ? (
            <Button
              type="primary"
              onClick={() => setSessionModal(true)}
              size="large"
            >
              Start Voting Session
            </Button>
          ) : (
            <Button
              type="primary"
              danger
              onClick={() => stopVotingSession()}
              size="large"
            >
              Stop Voting Session
            </Button>
          )}
        </div>
        {(votingActive || lastSessionId) && (
          <>
            {votingActive && (
              <Card>
                <div style={{ display: "flex", width: "100%", gap: 24 }}>
                  <div style={{ flex: 1, maxWidth: 200 }}>
                    <Statistic
                      title="Session Time Left"
                      value={formatSeconds(sessionTimeLeft)}
                      valueStyle={{ color: "#3f8600" }}
                    />
                    <Statistic
                      title="Total Votes"
                      value={sessionVoteCount}
                      valueStyle={{ color: "#3f8600" }}
                    />
                    <Statistic
                      title="Not Voted Users"
                      value={notVotedUserCount}
                      valueStyle={{ color: "#cf1322" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Table
                      style={{ width: "100%" }}
                      dataSource={(votingActive
                        ? sessionCandidates
                        : lastSessionCandidates
                      ).map((uid) => ({
                        key: uid,
                        name:
                          (users.find((u) => u.uid === uid) || {}).name || uid,
                        votes:
                          (votingActive ? candidateVotes : lastCandidateVotes)[
                            uid
                          ] || 0,
                      }))}
                      columns={[
                        { title: "Candidate", dataIndex: "name" },
                        { title: "Votes", dataIndex: "votes" },
                        {
                          title: "UID",
                          dataIndex: "key",
                          render: (text) => (
                            <span style={{ fontFamily: "monospace" }}>{text}</span>
                          ),
                        },
                        {
                          title: "Vote Choice",
                          // dataIndex: "votes",
                          render: (record) => {
                            const letter = String.fromCharCode(
                              65 + sessionCandidates.indexOf(record.key)
                            );
                            return (
                              <span style={{ fontFamily: "monospace" }}>
                                {letter}
                              </span>
                            );
                          }
                        }
                      ]}
                      pagination={false}
                      size="small"
                      title={() =>
                        votingActive
                          ? "Current Session Votes"
                          : "Last Session Votes"
                      }
                    />
                  </div>
                  {/* <div style={{ flex: 1, minWidth: 220 }}>
                    <Table
                      style={{ width: "100%" }}
                      dataSource={users
                        .filter((u) => {
                          const candidateUIDs = new Set(
                            votingActive
                              ? sessionCandidates
                              : lastSessionCandidates
                          );
                          const votedUIDs = new Set(
                            Object.keys(
                              votingActive ? candidateVotes : lastCandidateVotes
                            )
                          );
                          return (
                            !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid)
                          );
                        })
                        .map((u) => ({
                          key: u.uid,
                          name: u.name,
                          uid: u.uid,
                        }))}
                      columns={[
                        { title: "Not Voted User", dataIndex: "name" },
                        { title: "Card UID", dataIndex: "uid" },
                      ]}
                      pagination={false}
                      size="small"
                      title={() => "Not Voted Users"}
                    />
                  </div> */}
                </div>
              </Card>
            )}
          </>
        )}

        {/* Session Config Modal */}
        <Modal
          title="Configure Voting Session"
          open={sessionModal}
          onOk={() => sessionForm.submit()}
          onCancel={() => setSessionModal(false)}
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
              <Select
                mode="multiple"
                placeholder="Select candidates"
                maxCount={4}
              >
                {users.map((c) => (
                  <Option key={c.uid} value={c.uid} label={c.name}>
                    {c.name} ({c.uid})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Session History */}
        <Space direction="vertical" style={{ width: "100%", marginTop: 32 }}>
          <h3>Session History</h3>
          <Table
            style={{ marginTop: 24 }}
            dataSource={
              [...sessions].sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return 0;
              })
            }
            columns={[
              { title: "Session ID", dataIndex: "sessionId" },
              { title: "Start Time", dataIndex: "startTime" },
              {
                title: "End Time",
                dataIndex: "end_time",
                render: (text) =>
                  text ? moment(text).format("YYYY-MM-DD HH:mm:ss") : "-",
              },
              {
                title: "Duration",
                dataIndex: "duration",
                render: (secs) => formatSeconds(secs),
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (status) => (
                  <Badge
                    status={
                      status === "active"
                        ? "processing"
                        : status === "stopped"
                        ? "error"
                        : "default"
                    }
                    text={status.charAt(0).toUpperCase() + status.slice(1)}
                  />
                ),
              },
              { title: "Total Votes", dataIndex: "voteCount" },
              {
                title: "Total Not Voted Users",
                dataIndex: "notVotedUsers",
                render: (_, record) => {
                  const notVotedUsers = record.notVotedUsers || [];
                  return notVotedUsers.length > 0 ? (
                    <span>{notVotedUsers.length}</span>
                  ) : (
                    "-"
                  );
                },
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => (
                  <>
                    <Button
                      type="link"
                      onClick={() => {
                        setSelectedSession(record.sessionId);
                        setOpenSessionDetail(true);
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      type="link"
                      danger
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to remove this session and all its votes?"
                          )
                        ) {
                          await remove(ref(db, `sessions/${record.sessionId}`));
                          await remove(ref(db, `votes/${record.sessionId}`));
                          message.success("Session removed");
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </>
                ),
              },
            ]}
            pagination={{ pageSize: 50 }}
          />
        </Space>

        {/* Users List */}
        <Space direction="vertical" style={{ width: "100%" }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <h3>User List</h3>
            <Button type="primary" onClick={handleNew}>
              New User
            </Button>
          </Space>
          <Table
            dataSource={users}
            columns={[
              { title: "Name", dataIndex: "name" },
              { title: "Card UID", dataIndex: "uid" },
              {
                title: "Created At",
                dataIndex: "createdAt",
                render: (text) => moment(text).format("YYYY-MM-DD HH:mm:ss"),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => (
                  <Button
                    type="link"
                    danger
                    onClick={() => {
                      // remove user logic
                      if (
                        window.confirm(
                          `Are you sure you want to remove user ${record.name} (${record.uid})?`
                        )
                      ) {
                        remove(ref(db, `users/${record.uid}`))
                          .then(() => {
                            message.success("User removed successfully");
                          })
                          .catch((error) => {
                            message.error("Failed to remove user: " + error.message);
                          });
                      }
                    }}
                  >
                    Remove
                  </Button>
                ),
              },
            ]}
            pagination={false}
            size="small"
          />
        </Space>

        {/* Add Candidate Modal */}
        <Modal
          title="Add New User"
          open={adding}
          onCancel={() => setAdding(false)}
          footer={null}
        >
          <p>Please scan your card to register a new user.</p>
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item label="Card UID" name="uid" rules={[{ required: true }]}>
              <Input placeholder="Please scan your card" readOnly />
            </Form.Item>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="User Name" disabled={waitingForCard} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                disabled={waitingForCard}
                loading={waitingForCard}
              >
                {waitingForCard ? "Waiting for card" : "Save"}
              </Button>
              <Button
                onClick={() => {
                  setAdding(false);
                  set(ref(db, "mode/create"), 0); // close create mode
                  set(ref(db, "new_user"), null);
                  message.info("Cancelled");
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
          open={openSessionDetail}
          onCancel={() => {
            setOpenSessionDetail(false);
            setSelectedSession(null);
          }}
          centered
          footer={null}
          width={1200}
        >
          {detailSession && (
            <>
              <p>
                <b>Start Time:</b>{" "}
                {detailSession.start_time
                  ? moment
                      .unix(detailSession.start_time)
                      .format("YYYY-MM-DD HH:mm:ss")
                  : "-"}
              </p>
              <p>
                <b>Duration:</b> {formatSeconds(detailSession.duration)}
              </p>
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <b>Status:</b>
                <Badge
                  status={
                    detailSession.status === "active"
                      ? "processing"
                      : detailSession.status === "stopped"
                      ? "error"
                      : "default"
                  }
                  text={
                    detailSession.status.charAt(0).toUpperCase() +
                    detailSession.status.slice(1)
                  }
                />
              </p>
              <p>
                <b>Not Voted Users:</b>{" "}
                {(() => {
                  const candidateUIDs = new Set(detailCandidates);
                  const votedUIDs = new Set(Object.keys(detailCandidateVotes));
                  return users.filter(
                    (u) => !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid)
                  ).length;
                })()}
              </p>
              <Table
                dataSource={detailCandidates.map((uid) => ({
                  key: uid,
                  name: (users.find((u) => u.uid === uid) || {}).name || uid,
                  votes: detailCandidateVotes[uid] || 0,
                }))}
                columns={[
                  { title: "Candidate", dataIndex: "name" },
                  { title: "Votes", dataIndex: "votes" },
                  
                ]}
                pagination={false}
                size="small"
                style={{ marginBottom: 16 }}
                title={() => "Session Candidates"}
              />
              {/* Not Voted Users Table in Detail Modal */}
              {/* <Table
                dataSource={users
                  .filter((u) => {
                    const candidateUIDs = new Set(detailCandidates);
                    const votedUIDs = new Set(
                      Object.keys(detailCandidateVotes)
                    );
                    return !candidateUIDs.has(u.uid) && !votedUIDs.has(u.uid);
                  })
                  .map((u) => ({
                    key: u.uid,
                    name: u.name,
                    uid: u.uid,
                  }))}
                columns={[
                  { title: "Not Voted User", dataIndex: "name" },
                  { title: "Card UID", dataIndex: "uid" },
                ]}
                pagination={false}
                size="small"
                title={() => "Not Voted Users"}
              /> */}
            </>
          )}
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;
