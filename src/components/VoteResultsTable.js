import React from "react";
import { Table, Typography } from "antd";
import { getChoiceLetter, getCandidateName } from "../utils";

const { Text } = Typography;

function VoteResultsTable({
  candidates,
  candidateVotes,
  users,
  title = "Vote Results",
  size = "small",
  showChoiceLetter = true,
}) {
  const tableData = candidates.map((uid) => ({
    key: uid,
    uid,
    name: getCandidateName(uid, users),
    votes: candidateVotes[uid] || 0,
    choiceLetter: getChoiceLetter(candidates, uid),
  }));

  const columns = [
    { 
      title: "Candidate", 
      dataIndex: "name",
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.uid}
          </Text>
        </div>
      ),
    },
    { 
      title: "Votes", 
      dataIndex: "votes",
      render: (votes) => <strong>{votes}</strong>,
      sorter: (a, b) => b.votes - a.votes,
      defaultSortOrder: 'descend',
    },
  ];

  if (showChoiceLetter) {
    columns.push({
      title: "Choice",
      dataIndex: "choiceLetter",
      render: (letter) => (
        <Text code style={{ fontWeight: 'bold' }}>{letter}</Text>
      ),
    });
  }

  return (
    <Table
      dataSource={tableData}
      columns={columns}
      pagination={false}
      size={size}
      title={() => title}
      showSorterTooltip={false}
    />
  );
}

export default VoteResultsTable;
