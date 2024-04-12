.PHONY: build-mac build-windows run clean test fmt vet build

build-mac:
    GOOS=darwin GOARCH=amd64 go build -o myapp-mac

build-windows:
    GOOS=windows GOARCH=amd64 go build -o myapp-windows.exe

run:
    go run .

clean:
    rm -f myapp-mac myapp-windows.exe

test:
    go test ./...

fmt:
    go fmt ./...

vet:
    go vet ./...

build: build-mac build-windows