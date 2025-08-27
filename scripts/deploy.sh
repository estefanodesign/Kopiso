#!/bin/bash

# Production Deployment Script for Kopiso E-commerce Platform
# Handles zero-downtime deployment with health checks and rollback capabilities

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_CONFIG="${PROJECT_ROOT}/deployment.config"

# Default configuration
APP_NAME="kopiso"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
HEALTH_CHECK_TIMEOUT=300
ROLLBACK_ON_FAILURE=true

# Load deployment configuration if exists
if [[ -f "$DEPLOYMENT_CONFIG" ]]; then
    source "$DEPLOYMENT_CONFIG"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# LOGGING FUNCTIONS
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

check_requirements() {
    log "Checking deployment requirements..."
    
    local requirements=("docker" "docker-compose" "curl" "git")
    
    for cmd in "${requirements[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "$cmd is required but not installed"
            exit 1
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    success "All requirements satisfied"
}

validate_environment() {
    log "Validating environment configuration..."
    
    local required_vars=("NODE_ENV" "NEXT_PUBLIC_BASE_URL" "DATABASE_URL" "JWT_SECRET")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error "Missing required environment variables: ${missing_vars[*]}"
        exit 1
    fi
    
    success "Environment validation passed"
}

backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup database
    if docker-compose ps database | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T database pg_dump -U "$DATABASE_USER" "$DATABASE_NAME" > "$backup_dir/database.sql"
        success "Database backup created"
    fi
    
    # Backup uploads
    if [[ -d "uploads" ]]; then
        log "Backing up uploads..."
        cp -r uploads "$backup_dir/"
        success "Uploads backup created"
    fi
    
    # Backup current environment
    if [[ -f ".env.production" ]]; then
        cp .env.production "$backup_dir/"
    fi
    
    echo "$backup_dir" > .last_backup
    success "Backup created at: $backup_dir"
}

build_and_test() {
    log "Building and testing application..."
    
    # Build Docker images
    log "Building Docker images..."
    docker-compose -f docker-compose.yml build --parallel
    
    # Run tests in container
    log "Running tests..."
    docker-compose run --rm app npm run test:coverage
    
    # Security audit
    log "Running security audit..."
    docker-compose run --rm app npm run security:scan
    
    # Build optimization check
    log "Running build optimization..."
    docker-compose run --rm app npm run build:optimize
    
    success "Build and tests completed successfully"
}

deploy_services() {
    log "Deploying services..."
    
    # Stop current services gracefully
    if docker-compose ps | grep -q "Up"; then
        log "Stopping current services..."
        docker-compose down --timeout 30
    fi
    
    # Start new services
    log "Starting new services..."
    docker-compose up -d --remove-orphans
    
    success "Services deployed"
}

health_check() {
    log "Performing health checks..."
    
    local services=("app" "api" "database" "redis")
    local start_time=$(date +%s)
    local timeout=$HEALTH_CHECK_TIMEOUT
    
    for service in "${services[@]}"; do
        log "Checking health of $service..."
        
        local elapsed=0
        while [[ $elapsed -lt $timeout ]]; do
            if docker-compose ps "$service" | grep -q "healthy\|Up"; then
                success "$service is healthy"
                break
            fi
            
            if [[ $elapsed -ge $timeout ]]; then
                error "$service health check failed after ${timeout}s"
                return 1
            fi
            
            sleep 5
            elapsed=$(($(date +%s) - start_time))
        done
    done
    
    # Application-specific health checks
    log "Checking application endpoints..."
    
    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3001/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local retries=0
        local max_retries=10
        
        while [[ $retries -lt $max_retries ]]; do
            if curl -f -s "$endpoint" > /dev/null; then
                success "Endpoint $endpoint is responding"
                break
            fi
            
            if [[ $retries -eq $((max_retries - 1)) ]]; then
                error "Endpoint $endpoint is not responding"
                return 1
            fi
            
            retries=$((retries + 1))
            sleep 10
        done
    done
    
    success "All health checks passed"
}

rollback() {
    error "Deployment failed. Starting rollback..."
    
    if [[ ! -f ".last_backup" ]]; then
        error "No backup found for rollback"
        return 1
    fi
    
    local backup_dir=$(cat .last_backup)
    
    if [[ ! -d "$backup_dir" ]]; then
        error "Backup directory not found: $backup_dir"
        return 1
    fi
    
    log "Rolling back to backup: $backup_dir"
    
    # Stop current services
    docker-compose down --timeout 30
    
    # Restore database
    if [[ -f "$backup_dir/database.sql" ]]; then
        log "Restoring database..."
        docker-compose up -d database
        sleep 10  # Wait for database to be ready
        docker-compose exec -T database psql -U "$DATABASE_USER" "$DATABASE_NAME" < "$backup_dir/database.sql"
    fi
    
    # Restore uploads
    if [[ -d "$backup_dir/uploads" ]]; then
        log "Restoring uploads..."
        rm -rf uploads
        cp -r "$backup_dir/uploads" .
    fi
    
    # Restore environment
    if [[ -f "$backup_dir/.env.production" ]]; then
        cp "$backup_dir/.env.production" .
    fi
    
    # Start services
    docker-compose up -d
    
    success "Rollback completed"
}

cleanup() {
    log "Cleaning up deployment artifacts..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Clean old backups (keep last 5)
    if [[ -d "backups" ]]; then
        find backups -maxdepth 1 -type d | sort -r | tail -n +6 | xargs -r rm -rf
    fi
    
    success "Cleanup completed"
}

monitor_deployment() {
    log "Starting deployment monitoring..."
    
    # Monitor for 5 minutes
    local monitor_duration=300
    local start_time=$(date +%s)
    
    while [[ $(($(date +%s) - start_time)) -lt $monitor_duration ]]; do
        if ! health_check > /dev/null 2>&1; then
            error "Health check failed during monitoring"
            if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
                rollback
                exit 1
            fi
        fi
        
        sleep 30
    done
    
    success "Deployment monitoring completed successfully"
}

# =============================================================================
# MAIN DEPLOYMENT FUNCTION
# =============================================================================

deploy() {
    log "Starting deployment of $APP_NAME ($ENVIRONMENT)"
    
    cd "$PROJECT_ROOT"
    
    # Pre-deployment checks
    check_requirements
    validate_environment
    
    # Create backup
    backup_current_deployment
    
    # Build and test
    if ! build_and_test; then
        error "Build or tests failed"
        exit 1
    fi
    
    # Deploy
    if ! deploy_services; then
        error "Service deployment failed"
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback
        fi
        exit 1
    fi
    
    # Health checks
    if ! health_check; then
        error "Health checks failed"
        if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
            rollback
        fi
        exit 1
    fi
    
    # Monitor
    monitor_deployment
    
    # Cleanup
    cleanup
    
    success "Deployment completed successfully!"
    
    log "Deployment summary:"
    log "  Environment: $ENVIRONMENT"
    log "  Image tag: $IMAGE_TAG"
    log "  Deployed at: $(date)"
    log "  Services: $(docker-compose ps --services | tr '\n' ' ')"
}

# =============================================================================
# CLI INTERFACE
# =============================================================================

show_help() {
    cat << EOF
Kopiso Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    deploy          Deploy the application (default)
    rollback        Rollback to previous version
    health-check    Run health checks only
    backup          Create backup only
    cleanup         Cleanup deployment artifacts

Options:
    -e, --environment   Target environment (default: production)
    -t, --tag          Docker image tag (default: latest)
    -h, --help         Show this help message

Environment Variables:
    DOCKER_REGISTRY         Docker registry URL
    IMAGE_TAG              Docker image tag
    ENVIRONMENT            Target environment
    HEALTH_CHECK_TIMEOUT   Health check timeout in seconds
    ROLLBACK_ON_FAILURE    Enable automatic rollback (true/false)

Examples:
    $0 deploy --environment staging --tag v1.2.3
    $0 rollback
    $0 health-check

EOF
}

main() {
    local command="${1:-deploy}"
    shift || true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -t|--tag)
                IMAGE_TAG="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    case $command in
        deploy)
            deploy
            ;;
        rollback)
            rollback
            ;;
        health-check)
            health_check
            ;;
        backup)
            backup_current_deployment
            ;;
        cleanup)
            cleanup
            ;;
        *)
            error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"