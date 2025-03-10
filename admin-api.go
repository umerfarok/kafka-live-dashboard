package main

import (
	"encoding/json"
	"net/http"

	"github.com/IBM/sarama"
)

func (s *Server) ServeKafkaMetrics(w http.ResponseWriter, r *http.Request) {

	brokers := s.kafkaConn.Brokers() 
	brokerIDs := make([]int32, len(brokers))
	for i, broker := range brokers { 
		brokerIDs[i] = broker.ID()
	}


	topics, err := s.kafkaConn.Topics()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}


	topicDetails := make(map[string]interface{})
	for _, topic := range topics {
		partitions, err := s.kafkaConn.Partitions(topic)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		partitionDetails := make(map[int32]interface{})
		for _, partition := range partitions {
			offsetNewest, err := s.kafkaConn.GetOffset(topic, partition, sarama.OffsetNewest)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			offsetOldest, err := s.kafkaConn.GetOffset(topic, partition, sarama.OffsetOldest)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			leader, err := s.kafkaConn.Leader(topic, partition)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			replicas, err := s.kafkaConn.Replicas(topic, partition)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			isr, err := s.kafkaConn.InSyncReplicas(topic, partition)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			partitionDetails[partition] = map[string]interface{}{
				"offsetNewest": offsetNewest,
				"offsetOldest": offsetOldest,
				"leader":       leader.ID(),
				"replicas":     replicas,
				"isr":          isr,
			}
		}

		topicDetails[topic] = partitionDetails
	}


	response := map[string]interface{}{
		"brokers": brokerIDs,
		"topics":  topicDetails,
	}


	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
