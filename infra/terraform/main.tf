terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    # Override in CI/CD with backend config
    bucket         = "auraic-terraform-state"
    key            = "platform/terraform.tfstate"
    region         = "ap-southeast-1"
    encrypt        = true
    dynamodb_table = "auraic-tf-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Auraic"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

module "storage" {
  source      = "./modules/storage"
  environment = var.environment
  app_name    = var.app_name
}

module "database" {
  source             = "./modules/database"
  environment        = var.environment
  app_name           = var.app_name
  db_name            = var.db_name
  db_username        = var.db_username
  db_instance_class  = var.db_instance_class
  allocated_storage  = var.db_allocated_storage
}

module "compute" {
  source            = "./modules/compute"
  environment       = var.environment
  app_name          = var.app_name
  database_url      = module.database.connection_url
  storage_bucket    = module.storage.media_bucket_name
  backend_image     = var.backend_docker_image
  frontend_image    = var.frontend_docker_image
}

module "cdn" {
  source           = "./modules/cdn"
  environment      = var.environment
  domain_name      = var.domain_name
  backend_origin   = module.compute.backend_endpoint
  frontend_origin  = module.compute.frontend_endpoint
}
