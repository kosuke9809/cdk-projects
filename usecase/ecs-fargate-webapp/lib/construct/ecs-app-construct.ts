import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface EcsAppConstructProps {
  serviceName: string;
  removalPolicy: cdk.RemovalPolicy;
  autoDeleteImages: boolean;
}

export class EcsAppConstruct extends Construct {
  public readonly taskRole: iam.Role;
  constructor(scope: Construct, id: string, props: EcsAppConstructProps) {
    super(scope, id);

    const ecrRepository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: `${props.serviceName}-repository`.slice(0, 256),
      removalPolicy: props.removalPolicy,
      autoDeleteImages: props.autoDeleteImages,
    });

    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const taskExecRole = new iam.Role(this, 'TaskExecRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    new ssm.StringParameter(this, 'EcrRepositoryArn', {
      parameterName: `/${props.serviceName}/ecr-repository-arn`,
      stringValue: ecrRepository.repositoryArn,
    });

    new ssm.StringParameter(this, 'TaskRoleArn', {
      parameterName: `/${props.serviceName}/task-role-arn`,
      stringValue: taskRole.roleArn,
    });

    new ssm.StringParameter(this, 'TaskExecRoleArn', {
      parameterName: `/${props.serviceName}/task-exec-role-arn`,
      stringValue: taskExecRole.roleArn,
    });

    this.taskRole = taskRole;
  }
}
