import json
import datetime as dt
import dateutil.parser as dp
import requests
import polling
from celery import shared_task
from django.conf import settings

from system.services import NotificationServices
from workflows.services import WorkflowServices
from workflows.models import WorkflowRun, STATUS_RECEIVED, STATUS_FAILURE

import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)

@shared_task
def runWorkflowJob(workflowId: int, workflowRunId: int = None):
	"""
    Celery task to run a Workflow
    :param workflowId: ID of Workflows.workflow model
	"""
	try:
		dependentWorkflowIds = WorkflowServices.runWorkflow(workflowId=workflowId, workflowRunId=workflowRunId)
		for workflowId in dependentWorkflowIds:
			workflowRun = WorkflowRun.objects.create(workflow_id=workflowId, status=STATUS_RECEIVED)
			runWorkflowJob.delay(workflowId=workflowId, workflowRunId=workflowRun.id)
	except Exception as ex:
		WorkflowRun.objects.filter(id=workflowRunId).update(status=STATUS_FAILURE)