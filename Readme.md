# fib-build
------------

## Introduction

Deploying applications across various environments is a common challenge in software development. fib-build is a robust tool specifically designed for the fibjs environment, aimed at simplifying this process. It packages application directories into standalone executable files, making deployment and distribution of fibjs applications straightforward. With fib-build, developers can generate a single executable that encapsulates the entire application, including all dependencies and resource files. This eliminates the need for users to install fibjs separately, ensuring that the application can run seamlessly on different systems. By streamlining the deployment process, fib-build enhances efficiency and reduces the complexity associated with managing multiple environments.

## Key Features

### Comprehensive Single Executable File

fib-build excels in creating a comprehensive single executable file that encapsulates the entire fibjs application. This includes not only the core application logic but also all associated resource files and dependencies. By consolidating everything into one executable, fib-build eliminates the need for users to manage complex environmental setups or dependency installations. This feature significantly simplifies the deployment process, allowing users to run the application with a single command, regardless of the underlying system configuration.

### Flexible Custom Base Executable Program

One of the standout features of fib-build is its flexibility in specifying the base executable program. Users have the option to use the current fibjs executable as the default base file or to specify a different executable tailored to various operating systems and architectures. This customization capability ensures that the packaged application can meet diverse deployment requirements, enhancing its adaptability and usability across different environments. Whether targeting Windows, macOS, or Linux, fib-build provides the tools necessary to create a compatible and efficient executable.

### Robust Cross-Platform Compatibility

While it is generally recommended to generate executables on the target operating system to avoid compatibility issues, fib-build supports cross-platform packaging. This feature is particularly beneficial for developers working in macOS environments, as it ensures the stability and compatibility of the executable files on macOS systems. By leveraging fib-build's cross-platform capabilities, developers can streamline their workflow and reduce the overhead associated with managing multiple development environments. This makes fib-build an invaluable tool for teams aiming to deploy applications across various platforms seamlessly.

## Installation Steps

Before starting with fib-build, ensure that fibjs is installed on your system. If it is not installed, please visit the fibjs Installation Guide to set up the environment. Once fibjs is installed, navigate to your project directory and install fib-build using the following command:

```sh
cd your-project-directory
fibjs --install fib-build -D
```

## Usage

Once installed, fib-build can be utilized via the command-line interface to package fibjs applications. The basic usage is as follows:

```sh
fibjs fbuild <folder> --outfile=<file>
```

### Parameter Description

- `<folder>`: Directory containing the fibjs application. This is the root directory where your application code resides. Typically, this is the current directory (`.`), but you can also specify a different directory to handle other projects.
- `--outfile=<file>`: Required. Path where the executable file should be saved. It is recommended not to save the output file in the project directory to avoid including it in the next packaging process. This specifies the output location and name of the generated executable.

### Optional Parameters

- `--execfile=<file>`: Specify the base executable file, such as a specific fibjs binary. By default, it uses the executable that is currently running. This option allows you to customize the base binary used for packaging, which can be useful for compatibility with different operating systems or specific versions of fibjs.

These parameters ensure that the packaging process is flexible and can be tailored to different deployment needs, making it easier to create optimized and portable fibjs applications.

## Application Examples

### Packaging a Simple fibjs Application

To package a simple fibjs application, assume you are in the project directory that contains your fibjs application. You want to create an executable named myAppExecutable. You can achieve this by running the following command in your terminal:

```sh
cd your-project-directory
fibjs fbuild . --outfile=../myAppExecutable
```

This command will package the contents of the current directory into an executable file named myAppExecutable.

### Using a Specified fibjs Executable

In some cases, you might want to use a different fibjs binary as the base for your executable. This can be useful for ensuring compatibility with different operating systems or architectures. To specify a different fibjs binary, use the --execfile option:

```sh
cd your-project-directory
fibjs fbuild . --outfile=../myAppExecutable --execfile=path/to/other/fibjs
```
This command will package the current directory into an executable named myAppExecutable, using the specified fibjs binary located at path/to/other/fibjs.

## File Ignore Rules

During the build process, fib-build optimizes the packaging by excluding certain files. Specifically, it ignores:

- Files within directories that start with a dot (.), such as .git or .env.
- Files located in the fib-build module directory.
- Files located in the postject module directory.

This selective exclusion ensures that only essential components are included in the final executable, resulting in a cleaner and more efficient package. By omitting unnecessary files, fib-build creates a lightweight and performant executable ready for deployment across various environments.

## Common Issues and Solutions

### Execution Failure on macOS

If an executable targeted for macOS is created on non-macOS platforms, it might fail when run on macOS. This issue often arises because the application is not properly signed when packaged on other operating systems. macOS requires applications to be signed to ensure security and integrity. Packaging on a macOS machine ensures that the application is correctly signed, preventing execution failures and security warnings.

If you encounter this issue, you can try manually signing the application using the following command:
```sh
codesign -s - myAppExecutable
```
This command signs the myAppExecutable, which can help resolve execution failures and security warnings on macOS.

### Output File in Project Directory

If the --outfile parameter is set to a path within the project directory, the generated executable will be included in the next packaging process. This can significantly increase the size of the packaged software. To avoid this issue, it is recommended to specify an output path outside the project directory. For example:

```sh
fibjs fbuild <folder> --outfile=../myAppExecutable
```

This ensures that the executable is saved outside the project directory, preventing it from being included in subsequent packaging operations.

### Compression of Application

To reduce the size of your application, you can inspect the output of fbuild. During the build process, fbuild highlights files larger than 16k in red and files larger than 4k in yellow. By reviewing these larger files, you can determine if they are necessary for runtime. If they are not required, you can delete them and repackage the application. This process helps in creating a more compact and efficient executable.

### Performance Considerations

While packaging simplifies the deployment process, it is important to note that the initial loading time of the executable might increase due to the need to unpack and deploy files at runtime. To mitigate this, consider optimizing the application’s startup process and minimizing the number of files that need to be unpacked.

## Conclusion

fib-build is a potent tool that eases the deployment process of fibjs applications, enabling developers to effortlessly distribute and execute them in different environments. Following the steps and recommendations provided can optimize the application’s deployment process and enhance its applicability across various environments.

For more detailed information and advanced features, please refer to the official fibjs documentation. Through these resources, developers can gain a deeper understanding of how to effectively utilize fib-build to enhance the portability and usability of their applications. This guide outlines the steps for installation, usage, and addresses common issues with solutions to ensure a smooth application packaging process. Whether you are a seasoned developer or a newbie to fibjs, understanding the capabilities and features of fib-build will significantly benefit the workflow and distribution of your applications.