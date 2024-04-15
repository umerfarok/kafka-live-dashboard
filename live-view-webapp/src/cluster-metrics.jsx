import { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

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
        <div>
            <Typography variant="h4" gutterBottom sx={{ mt: 16, mb: 2, color: 'black' }}>
                KAFKA METRICS
            </Typography>
            <TableContainer component={Paper} sx={{ mt: 6 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Partition</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Newest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Oldest Offset</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Leader</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Replicas</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>In-Sync Replicas</TableCell>
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
        </div>
    );
}

export default KafkaMetrics;
