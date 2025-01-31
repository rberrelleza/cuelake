import React, { useState, useEffect, useRef } from "react";
import style from "./style.module.scss";
import Moment from 'react-moment';
import _ from "lodash";
import {
    Table,
    Button,
    Modal,
    Input,
    Select,
    Icon,
    Tooltip,
    Popover,
    Form,
    message,
    Drawer,
    Row,
    Col,
    Switch,
    Tabs,
    Menu, 
    Dropdown,
    Popconfirm,
  } from "antd";
import { MoreOutlined, EditOutlined, PlayCircleOutlined, UnorderedListOutlined, StopOutlined, FileTextOutlined, DeleteOutlined, CopyOutlined, CloseOutlined} from '@ant-design/icons';
import { Badge } from "reactstrap";
import WorkflowRuns from "./WorkflowRuns"
import SelectSchedule from "components/Schedule/selectSchedule"

import workflowsService from "services/workflows";
import notebookService from "services/notebooks";

const { TabPane } = Tabs;
const { Option } = Select;

export default function Workflows(props) {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notebooksLight, setNotebooksLight] = useState([])
    const [total, setTotal] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const [selectedWorkflow, setSelectedWorkflow] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [selectedNotebooks, setSelectedNotebooks] = useState([]);

    const [isRunLogsDrawerVisible, setIsRunLogsDrawerVisible] = useState(false);
    const [isEditCreateWorkflow, setIsEditCreateWorkflow] = useState(false);

    const [newWorkflowName, setNewWorkflowName] = useState('');
    const [triggerWorkflow, setTriggerWorkflow] = useState(false);
    const [triggerWorkflowStatus, setTriggerWorkflowStatus] = useState("always");

    const [assignTriggerWorkflow, setAssignTriggerWorkflow] = useState(false)         // stores id of parent workflow 
    // const [showSelectTriggerWorkflow, setShowSelectTriggerWorkflow] = useState(false)
    const [assignSchedule, setAssignSchedule] = useState(false)
    // const [showSelectSchedule, setShowSelectSchedule] = useState(false)

    const currentPageRef = useRef(currentPage);
    currentPageRef.current = currentPage;

    const getWorkflows = async (offset) => {
      setLoading(true)
      const response = await workflowsService.getWorkflows(offset);
      if(response){
        setWorkflows(response.workflows);
        setTotal(response.Total)
      }
      setLoading(false)
      if(!offset) setCurrentPage(1)
    };

    const openRunLogs = workflow => {
        setSelectedWorkflow(workflow)
        setIsRunLogsDrawerVisible(true)
    }

    const closeWorkflowRunsDrawer = () => {
        setIsRunLogsDrawerVisible(false)
        setSelectedWorkflow('')
    }
    
    useEffect(() => {
      getNotebooksLight()
      const refreshWorkflowsInterval = setInterval(() => {
        refreshWorkflows()
      }, 3000);

      return () => {
        clearInterval(refreshWorkflowsInterval);
      };
    }, []);

    const refreshWorkflows = async () => {
      const offset = (currentPageRef.current - 1)*10
      const response = await workflowsService.getWorkflows(offset);
      if(response){
        setWorkflows(response.workflows);
        setTotal(response.total);
      }
    };

    const handleTableChange = (event) => {
      setCurrentPage(event.current)
      getWorkflows((event.current - 1)*10)
    }

    const getNotebooksLight = async () => {
      if (_.isEmpty(notebooksLight)){
        const response = await notebookService.getNotebooksLight();
        if(response){
          setNotebooksLight(response);
        }
      }
    }

    const addWorkflow = () => {
      getNotebooksLight()
      setIsEditCreateWorkflow(true)
      setSelectedWorkflow('')
    }

    const editWorkflow = workflow => {
      getNotebooksLight()
      setIsEditCreateWorkflow(true)
      setSelectedWorkflow(workflow)
      setSelectedNotebooks(workflow.notebooks)

      if (workflow.schedule){
        setSelectedSchedule(workflow.schedule.id)
      }

      setNewWorkflowName(workflow.name)
      setTriggerWorkflow(workflow.triggerWorkflow)
      setTriggerWorkflowStatus(workflow.triggerWorkflowStatus)
    }

    const saveWorkflow = async () => {
      if(!_.isEmpty(newWorkflowName)){
        const data = {
          id: selectedWorkflow.id,
          name: newWorkflowName,
          notebookIds: selectedNotebooks,
          scheduleId: selectedSchedule,
          triggerWorkflowId: triggerWorkflow ? triggerWorkflow.id : null,
          triggerWorkflowStatus: triggerWorkflowStatus
        }
        const response = await workflowsService.setWorkflows(data);
        if(response){
          setIsEditCreateWorkflow(false)
          settingInitialValues()
        }
      }
      else{
        message.error('Please fill values');
      }
      refreshWorkflows()
    }

    const handleCancel = () => {
      setIsEditCreateWorkflow(false)
      settingInitialValues()
    }

    const settingInitialValues = () => {
      setSelectedWorkflow("")
      setNewWorkflowName('')
      setSelectedNotebooks([])
      setSelectedSchedule(null)
      setTriggerWorkflow(false)
      setTriggerWorkflowStatus("always")
      setAssignSchedule(false)
      setAssignTriggerWorkflow(false)
    }

    const showNotebooksOfWorkflow = workflow => {
      const notebookNames = notebooksLight.filter(notebook => workflow.notebooks.find(x => x==notebook.id)).map(notebook => notebook.path.substring(1))
      return <span><b>Notebooks: </b>{notebookNames.join(", ")}</span>
    }

    const runWorkflow = async workflow => {
      const response = await workflowsService.runWorkflow(workflow.id);
      refreshWorkflows()
    }

    const stopWorkflow = async workflow => {
      const response = await workflowsService.stopWorkflow(workflow.id);
      refreshWorkflows()
    }

    const deleteNotebook = async workflow => {
      const response = await workflowsService.deleteWorkflow(workflow.id);
      refreshWorkflows()
    }

    const columns = [
      {
        title: "Workflow",
        dataIndex: "name",
        key: "workflow",
        render: text => {
          return (
            <span>
              {text}
            </span>
          );
        }
      },
      {
        title: 'Trigger Workflow',
        dataIndex: "triggerWorkflow",
        key: "triggerWorkflow",
        render: (text, workflow) => {
          if (workflow.triggerWorkflow){
              return (
                <span className={style.triggerWorkflow}>
                  {text ? text.name + " " : ""}
                  {text && workflow.triggerWorkflowStatus != "always" ?         
                    <Badge
                      color="primary"
                      className={`m-1 ${style.badge}`}
                      pill
                      key={workflow.id}
                    >{workflow.triggerWorkflowStatus}</Badge> : null
                  }
                  <Tooltip title={"Unassign Workflow"}> 
                    <span className={style.icon} onClick={()=>updateAssignedTriggerWorkflow(workflow.id)}><CloseOutlined /></span>
                  </Tooltip>
                </span>
              );

          }
          else {
            if (assignTriggerWorkflow && assignTriggerWorkflow == workflow.id){
              return <Modal
                        title={"Assign Trigger Workflow"}
                        visible={true}
                        onOk={()=>updateAssignedTriggerWorkflow(workflow.id)}
                        onCancel={settingInitialValues}
                        okText="Save"
                        bodyStyle={{ paddingBottom: 80 }}
                      >
                        {selectTriggerWorkflowElement}
                      </Modal>
            } else {
              return <a className={style.linkText} onClick={()=>setAssignTriggerWorkflow(workflow.id)}>Assign Workflow</a>
            }
          }
        }
      },
      {
        title: 'Schedule',
        dataIndex: "schedule",
        key: "schedule",
        render: (text, workflow) => {
          if (workflow.schedule){
              return (
                <span className={style.scheduleText}>
                  {text ? text.name + " " : ""}
                  <Tooltip title={"Unassign Workflow"}> 
                    <span className={style.icon} onClick={()=>updateAssignedSchedule(workflow.id)}><CloseOutlined /></span>
                  </Tooltip>
                </span>
              );

          }
          else {
            if (assignSchedule && assignSchedule == workflow.id){
              return <Modal
                        title={"Assign Schedule"}
                        visible={true}
                        onOk={()=>updateAssignedSchedule(workflow.id)}
                        onCancel={settingInitialValues}
                        okText="Save"
                        bodyStyle={{ paddingBottom: 80 }}
                      >
                        <SelectSchedule onChange={(value)=>setSelectedSchedule(value)} />
                      </Modal>
            } else {
              return <a className={style.linkText} onClick={()=>setAssignSchedule(workflow.id)}>Assign Schedule</a>
            }
          }          
        }
      },
      {
        title: "Last run",
        dataIndex: "lastRun",
        key: "lastRunTime",
        sorter: (a, b) => {
          return Math.abs(
            new Date(a.lastRun ? a.lastRun.startTimestamp : null) - new Date(b.lastRun ? b.lastRun.startTimestamp : null)
          );
        },
        defaultSortOrder: "descend",
        render: lastRun => {
          return (
            <span>
            {lastRun ? <Moment format="DD-MM-YYYY hh:mm:ss">{lastRun.startTimestamp}</Moment> : null}
            </span>
          );
        }
      },
      {
        title: "Actions",
        dataIndex: "",
        key: "",
        // width: "10%",
        render: (text, workflow) => {
          const menu = (<Menu>
              <Menu.Item key="1">
                <Popconfirm
                    title={"Are you sure to delete "+ workflow.name +"?"}
                    onConfirm={() => deleteNotebook(workflow)}
                    okText="Yes"
                    cancelText="No"
                >
                <DeleteOutlined />
                  Delete Notebook
                </Popconfirm>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="2" onClick={() => openRunLogs(workflow)} >
                <UnorderedListOutlined />
                View Runs
              </Menu.Item>
            </Menu>
          )

          return (
            <div className={style.actions}>
              { workflow.lastRun && (workflow.lastRun.status === "running" ||  workflow.lastRun.status === "received")
                ?
                <Tooltip title={"Stop Workflow"}> 
                  <StopOutlined onClick={() => stopWorkflow(workflow)} />
                </Tooltip>
                :
                <Tooltip title={"Run Workflow"}> 
                  <PlayCircleOutlined onClick={() => runWorkflow(workflow)} />
                </Tooltip>
              }
             
              <Tooltip title={"Edit Workflow"}>
                <EditOutlined onClick={() => editWorkflow(workflow)} />
              </Tooltip>
              <Tooltip title={"More"}>
                <Dropdown overlay={menu} trigger={['click']}>
                  <MoreOutlined />
                </Dropdown>
              </Tooltip>
            </div>
          );
        }
    }
    ]

    const updateAssignedTriggerWorkflow = async (workflowId) => {
      const data = {
        triggerWorkflowId: triggerWorkflow ? triggerWorkflow.id : null,
        triggerWorkflowStatus: triggerWorkflowStatus
      }

      const response = await workflowsService.updateTriggerWorkflow(workflowId, data);
      if (response){settingInitialValues() }
      refreshWorkflows()
    }

    const updateAssignedSchedule = async (workflowId) => {
      const data = {
          scheduleId: selectedSchedule
      }
      const response = await workflowsService.updateWorkflowSchedule(workflowId, data);
      if (response){settingInitialValues() }
      refreshWorkflows()
    }

    const workflowOptionElements = workflows.map(workflow => 
      <Option value={workflow.id} workflow={workflow} key={workflow.id}> {workflow.name} </Option>
    )

    const statuses = ["success", "failure", "always"]
    const statusOptionElements = statuses.map(status => 
        <Option value={status} key={status}> {status} </Option>
      )

    const notebooksLightElement = notebooksLight && notebooksLight.map(notebook => 
        <Option value={notebook.id} key={notebook.id} name={notebook.path.substring(1)}> {notebook.path.substring(1)} </Option>
      )

    const selectTriggerWorkflowElement = <><Form.Item label="Workflow Name">
                            <Select placeholder="Select Workflow" value={triggerWorkflow ? triggerWorkflow.id : ""} onChange={(value, option) => setTriggerWorkflow(option.workflow)}>
                              {workflowOptionElements}
                            </Select>
                          </Form.Item>
                          <Form.Item label="Workflow Status">
                            <Select onChange={(value) => setTriggerWorkflowStatus(value)} value={triggerWorkflowStatus}>
                              {statusOptionElements}
                            </Select>
                          </Form.Item></>


    const editCreateWorkflowElement = <Drawer 
              title={true ? "New Workflow" : "EditWorkflow"}
              width={720}
              visible={true}
              onOk={saveWorkflow}
              onClose={handleCancel}
              okText="Save"
              bodyStyle={{ paddingBottom: 80 }}
              footer={
                          <div
                            style={{
                              textAlign: 'right',
                            }}
                          >
                            <Button onClick={handleCancel} style={{ marginRight: 8 }}>
                              Cancel
                            </Button>
                            <Button onClick={saveWorkflow} type="primary">
                              Save
                            </Button>
                          </div>
                        }
            >
                <Form layout={"vertical"}>
                  <Form.Item label="Name">
                    <Input onChange={(event) => setNewWorkflowName(event.target.value)} value={newWorkflowName} placeholder="Sample Workflow">
                    </Input>
                  </Form.Item>
                  <Form.Item label="Notebooks">
                    <Select
                      mode="multiple"
                      allowClear
                      // style={{ width: '100%' }}
                      filterOption={(input, option) => 
                            option.props.name.toLowerCase().indexOf(input.toLowerCase()) >= 0 
                            || option.props.value.toLowerCase().indexOf(input.toLowerCase()) >= 0
                          }
                      placeholder="Please select notebooks"
                      value = {selectedNotebooks}
                      onChange={values=>setSelectedNotebooks(values)}
                    >
                      {notebooksLightElement}
                    </Select>
                  </Form.Item>
                  <Form.Item label="TRIGGERS ON">
                    <Tabs defaultActiveKey="1">
                        <TabPane
                          tab={
                            <span>
                              Schedule
                            </span>
                          }
                          key="1"
                        >
                          <SelectSchedule onChange={(value)=>setSelectedSchedule(value)} schedule={selectedSchedule}/>
                        </TabPane>
                        <TabPane
                          tab={
                            <span>
                              Workflow
                            </span>
                          }
                          key="2"
                        >
                          {selectTriggerWorkflowElement}
                        </TabPane>
                      </Tabs>
                  </Form.Item>
                </Form>
            </Drawer>

    return (
          <div>
            <div className={`d-flex flex-column justify-content-center text-right mb-2`}>
              <Button 
                onClick={()=>addWorkflow()}
                type="primary"
                >
                New Workflow
              </Button>
            </div>
            { isEditCreateWorkflow ? editCreateWorkflowElement : null }
            <Table
                rowKey={"id"}
                scroll={{ x: "100%" }}
                columns={columns}
                dataSource={workflows}
                // showHeader={false}
                loading={loading}
                size={"small"}
                expandable={{
                    expandedRowRender: record => showNotebooksOfWorkflow(record),
                }}
                pagination={{
                  current: currentPage,
                  pageSize: 10,
                  total: total ? total : 0
                }}
                onChange={(event) => handleTableChange(event)}
            />
            <Drawer
                title={(selectedWorkflow ? selectedWorkflow.name : "")}
                width={720}
                onClose={closeWorkflowRunsDrawer}
                visible={isRunLogsDrawerVisible}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                  <div
                    style={{
                      textAlign: 'right',
                    }}
                  >
                    <Button onClick={closeWorkflowRunsDrawer} style={{ marginRight: 8 }}>
                      Close
                    </Button>
                  </div>
                }
              >
                { isRunLogsDrawerVisible 
                  ? 
                  <WorkflowRuns workflow={selectedWorkflow}></WorkflowRuns>
                  :
                  null
                }
            </Drawer>

        </div>
        )
}