import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope:Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      cidr: '10.30.0.0/16',
      maxAzs: 2, // Specify the number of availability zones you need
    });

    // Create a public subnet
    const publicSubnet = vpc.publicSubnets[0]; // You can select a specific subnet

    // Create an EC2 instance in the public subnet
    const ec2Instance = new ec2.Instance(this, 'MyEC2Instance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
    });

    // Create an SQS queue
    const queue = new sqs.Queue(this, 'MyQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Create an SNS topic
    const topic = new sns.Topic(this, 'MyTopic');

    // Create an AWS Secrets Manager secret with two key-value pairs
    const secret = new secretsmanager.Secret(this, 'MySecret', {
      secretName: 'metrodb-secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: '', password: '' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Output the ARN of the created resources for reference
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'EC2InstanceId', { value: ec2Instance.instanceId });
    new cdk.CfnOutput(this, 'QueueUrl', { value: queue.queueUrl });
    new cdk.CfnOutput(this, 'TopicArn', { value: topic.topicArn });
    new cdk.CfnOutput(this, 'SecretArn', { value: secret.secretArn });
  }
}

const app = new cdk.App();
new CdkStack(app, 'CdkStack');
