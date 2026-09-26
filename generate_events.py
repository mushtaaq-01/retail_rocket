import csv
import random

# Generate a realistic retail dataset with 500+ interactions
visitor_ids = [str(1000290 + i) for i in range(50)]
item_ids = [
    "48030", "89323", "228644", "291877", "65273", 
    "294676", "310944", "9877", "148103", "166306", 
    "215503", "24059", "255908", "279531", "347226"
]

# Create item correlation clusters so SVD learns real latent similarity
clusters = {
    "tech_audio": ["48030", "24059", "148103", "9877", "279531"],
    "work_computing": ["294676", "255908", "291877", "310944", "65273"],
    "lifestyle": ["89323", "228644", "215503", "347226", "166306"]
}

events_list = ["view", "view", "view", "addtocart", "addtocart", "transaction"]
base_timestamp = 1433221332117

rows = []
for i, visitor in enumerate(visitor_ids):
    # Assign visitor to a primary cluster + some random cross-over
    cluster_key = list(clusters.keys())[i % len(clusters)]
    primary_items = clusters[cluster_key]
    
    # 10 to 15 interactions per user
    num_events = random.randint(10, 18)
    for j in range(num_events):
        if random.random() < 0.75:
            item = random.choice(primary_items)
        else:
            item = random.choice(item_ids)
            
        event_type = random.choice(events_list)
        tx_id = random.randint(1000, 9999) if event_type == "transaction" else ""
        base_timestamp += random.randint(10, 500)
        
        rows.append([base_timestamp, visitor, event_type, item, tx_id])

with open("data/events.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["timestamp", "visitorid", "event", "itemid", "transactionid"])
    writer.writerows(rows)

print(f"Generated {len(rows)} events across {len(visitor_ids)} visitors and {len(item_ids)} items.")
