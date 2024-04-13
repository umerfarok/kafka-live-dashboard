import  { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

function KafkaMetrics() {
    const [data, setData] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:5001/kafka_metrics')
            .then(response => {
                setData(response.data);
            })
            .catch(error => {
                console.error('Error fetching data: ', error);
            });
    }, []);

    if (!data) {
        return <div>Loading...</div>;
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Topic</TableCell>
                        <TableCell>Partition</TableCell>
                        <TableCell>Newest Offset</TableCell>
                        <TableCell>Oldest Offset</TableCell>
                        <TableCell>Leader</TableCell>
                        <TableCell>Replicas</TableCell>
                        <TableCell>In-Sync Replicas</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Object.entries(data.topics).map(([topic, partitions]) =>
                        Object.entries(partitions).map(([partition, details], index) => (
                            <TableRow key={index}>
                                {index === 0 && <TableCell rowSpan={Object.keys(partitions).length}>{topic}</TableCell>}
                                <TableCell>{partition}</TableCell>
                                <TableCell>{details.offsetNewest}</TableCell>
                                <TableCell>{details.offsetOldest}</TableCell>
                                <TableCell>{details.leader}</TableCell>
                                <TableCell>{details.replicas.join(', ')}</TableCell>
                                <TableCell>{details.isr.join(', ')}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default KafkaMetrics;