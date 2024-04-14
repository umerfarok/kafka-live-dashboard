build-mac:
	set GOOS=darwin && set GOARCH=amd64 && go build -o live-api-mac

build-windows:
	cmd /C "(set GOOS=windows && set GOARCH=amd64 && go build -o live-api-windows.exe)"


build:
	go build -o ./live-api-kafka/live-api-kafka 
run:
	go run .

clean:
	rm -f live-ap-mac live-ap-windows.exe

test:
	go test ./...

fmt:
	go fmt ./...

vet:
	go vet ./...