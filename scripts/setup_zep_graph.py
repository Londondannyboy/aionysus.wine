#!/usr/bin/env python3
"""
Create the Wine knowledge graph in Zep Cloud.
Run this once to initialize the graph for wine-related knowledge.
"""

import os
from zep_cloud import Zep

# Zep API Key
ZEP_API_KEY = os.environ.get("ZEP_API_KEY", "z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0.Ssyb_PezcGgacQFq6Slg3fyFoqs8hBhvp6WsE8rO4VK_D70CT5tqDbFOs6ZTf8rw7qYfTRhLz5YFm8RR854rHg")

def main():
    print("Connecting to Zep Cloud...")
    client = Zep(api_key=ZEP_API_KEY)

    # Create the Wine knowledge graph
    graph_id = "wine"

    try:
        print(f"Creating graph '{graph_id}'...")
        result = client.graph.create(
            graph_id=graph_id,
            name="Wine Knowledge Graph",
            description="Knowledge graph for wine sommelier AI - stores wine preferences, tasting notes, regional knowledge, and user interactions."
        )
        print(f"Graph created successfully: {result}")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"Graph '{graph_id}' already exists - skipping creation")
        else:
            print(f"Error creating graph: {e}")
            raise

    # List graphs to verify
    print("\nListing all graphs...")
    try:
        graphs = client.graph.list()
        print(f"Found {len(graphs) if graphs else 0} graphs:")
        if graphs:
            for g in graphs:
                print(f"  - {g.graph_id}: {g.name}")
    except Exception as e:
        print(f"Error listing graphs: {e}")

    print("\nDone!")

if __name__ == "__main__":
    main()
