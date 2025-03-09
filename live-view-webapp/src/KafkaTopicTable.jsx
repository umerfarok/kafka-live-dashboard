import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Button, IconButton, Tooltip, useTheme } from '@mui/material';
import { Delete, PlayArrow, Stop } from '@mui/icons-material';

const KafkaTopicTable = ({ topics, searchTerm, onRowClick, onDeleteTopic }) => {
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    const onGridReady = (params) => {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    }; 

    const handleTopicClick = (topic) => {
        setSelectedTopic(topic === selectedTopic ? null : topic);
        onRowClick(topic);
    };

    const ActionsCellRenderer = (props) => {
        const isSelected = props.data.Name === selectedTopic;
        return (
            <div style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title={isSelected ? "Stop Monitoring" : "Start Monitoring"}>
                    <IconButton 
                        onClick={() => handleTopicClick(props.data.Name)}
                        color={isSelected ? "secondary" : "primary"}
                        size="small"
                    >
                        {isSelected ? <Stop /> : <PlayArrow />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete Topic">
                    <IconButton 
                        onClick={() => onDeleteTopic(props.data.Name)}
                        color="error"
                        size="small"
                    >
                        <Delete />
                    </IconButton>
                </Tooltip>
            </div>
        );
    };

    const columnDefs = useMemo(() => [
        { 
            field: 'Name', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 2,
            headerName: 'Topic Name'
        },
        { 
            field: 'Partitions', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1 
        },
        { 
            field: 'Replication', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            headerName: 'Replication Factor'
        },
        { 
            field: 'Active', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            cellRenderer: (params) => params.value ? '✅' : '❌'
        },
        { 
            field: 'Messages', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            valueFormatter: (params) => params.value.toLocaleString()
        },
        { 
            field: 'Lag', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            cellStyle: (params) => ({
                color: params.value > 1000 ? '#ff4444' : params.value > 100 ? '#ffbb33' : '#00C851'
            })
        },
        { 
            field: 'Throughput', 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            valueFormatter: (params) => `${params.value.toFixed(2)} msg/s`
        },
        {
            headerName: 'Actions',
            field: 'actions',
            sortable: false,
            filter: false,
            cellRenderer: ActionsCellRenderer,
            flex: 1
        }
    ], [selectedTopic]);

    const defaultColDef = {
        flex: 1,
        minWidth: 100,
        sortable: true,
        filter: true
    };

    const filteredTopics = topics.filter((topic) =>
        topic.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Define custom grid theme based on dark mode
    const gridTheme = isDarkMode ? 'ag-theme-material-dark' : 'ag-theme-material';

    return (
        <div 
            className={gridTheme} 
            style={{ 
                width: '100%', 
                height: 'calc(100vh - 500px)',
                '--ag-background-color': isDarkMode ? '#1e1e1e' : '#ffffff',
                '--ag-header-background-color': isDarkMode ? '#2d2d2d' : '#f5f5f5',
                '--ag-odd-row-background-color': isDarkMode ? '#262626' : '#fafafa',
                '--ag-header-foreground-color': isDarkMode ? '#ffffff' : '#000000',
                '--ag-foreground-color': isDarkMode ? '#ffffff' : '#000000',
            }}
        >
            <AgGridReact
                rowData={filteredTopics}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                animateRows={true}
                rowSelection="single"
                pagination={true}
                paginationPageSize={10}
                paginationAutoPageSize={true}
                enableCellTextSelection={true}
                tooltipShowDelay={0}
                tooltipHideDelay={2000}
                rowStyle={{ cursor: 'pointer' }}
            />
        </div>
    );
};

KafkaTopicTable.propTypes = {
    topics: PropTypes.array.isRequired,
    searchTerm: PropTypes.string,
    onRowClick: PropTypes.func.isRequired,
    onDeleteTopic: PropTypes.func.isRequired
};

export default KafkaTopicTable;