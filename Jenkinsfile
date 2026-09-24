pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('backend') {
                    sh '''
                        export JAVA_HOME=/usr/lib/jvm/java-21-amazon-corretto.x86_64
                        export PATH=$JAVA_HOME/bin:$PATH
                        java -version
                        mvn -version
                        mvn clean package -DskipTests
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}
