import { Table, Typography } from "antd";
import { getChoiceLetter, getCandidateName } from "../utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const { Text } = Typography;

function VoteResultsTable({
  candidates,
  candidateVotes,
  users,
  title = "Vote Results",
  size = "small",
  showChoiceLetter = true,
  showChart = true,
  showTable = true,
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          {
            // if user is the most voted candidate and not equals to 0, highlight their name
            record.votes === Math.max(...tableData.map(item => item.votes)) && record.votes !== 0 ? (
              <Text strong>
                {name} (Top Voted)
              </Text>
            ) : (
              <Text>{name}</Text>
            )}
          <Text type="secondary" style={{ fontSize: "12px" }}>
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
      defaultSortOrder: "ascend",
    },
  ];

  if (showChoiceLetter) {
    columns.push({
      title: "Choice",
      dataIndex: "choiceLetter",
      render: (letter) => (
        <Text code style={{ fontWeight: "bold" }}>
          {letter}
        </Text>
      ),
    });
  }

  return (
    <div>
      {showChart && (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={tableData} margin={{ top: 16, right: 16, left: 16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="votes" fill="#4096ff" />
          </BarChart>
        </ResponsiveContainer>
      )}
      {showTable && (
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size={size}
          title={() => title}
          showSorterTooltip={false}
          scroll={{y: 300, x: true}}
        />
      )}
    </div>
  );
}

export default VoteResultsTable;
