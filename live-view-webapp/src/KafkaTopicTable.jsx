import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@mui/material';

const KafkaTopicTable = ({ topics, searchTerm, onRowClick }) => {
    const [gridApi, setGridApi] = useState(null);
    const [gridColumnApi, setGridColumnApi] = useState(null);

    const onGridReady = (params) => {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    };

    KafkaTopicTable.propTypes = {
        topics: PropTypes.array.isRequired,
        searchTerm: PropTypes.string,
        onRowClick: PropTypes.func,
    };

    const filteredTopics = topics.filter((topic) =>
        topic.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columnDefs = [
        { field: 'Name', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Partitions', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Replication', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Active', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Messages', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Lag', sortable: true, filter: true, resizable: true, movable: true },
        { field: 'Throughput', sortable: true, filter: true, resizable: true, movable: true },
    ];

    const defaultColDef = {
        flex: 1,
        minWidth: 150,
    };

    const getRowHeight = () => {
        return 'auto';
    };

    const handleResetFilters = () => {
        if (gridApi) {
            gridApi.setFilterModel(null);
            gridApi.onFilterChanged();
        }
    };

    return (
        <div className="ag-theme-material" style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <Button variant="contained" onClick={handleResetFilters}>
                    Reset Filters
                </Button>
            </div>
            <AgGridReact
                rowData={filteredTopics}
                columnDefs={columnDefs}
                onGridReady={onGridReady}
                rowSelection="single"
                onRowClicked={(event) => onRowClick(event.data.Name)}
                defaultColDef={defaultColDef}
                getRowHeight={getRowHeight}
                pagination={true}
                paginationPageSize={10}
                paginationAutoPageSize={true}
                style={{ width: '100%', height: '100%' }}
                rowStyle={{ cursor: 'pointer' }}
                rowClass="clickable-row"
            />
        </div>
    );
};

export default KafkaTopicTable;