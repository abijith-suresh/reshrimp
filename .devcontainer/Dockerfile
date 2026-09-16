FROM node:24-slim

# Install essential packages
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install mise. The repository's mise.toml is the source of truth for Bun.
ENV MISE_INSTALL_PATH="/usr/local/bin/mise"
RUN curl --proto '=https' --proto-redir '=https' --fail --show-error --silent --location https://mise.run | sh

# Install GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user
RUN useradd -m -s /bin/bash nodeuser \
    && usermod -aG sudo nodeuser \
    && echo "nodeuser ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/nodeuser

USER nodeuser
WORKDIR /workspace

# Let mise expose the Bun version declared by the workspace mise.toml.
ENV MISE_DATA_DIR="/home/nodeuser/.local/share/mise"
ENV PATH="/home/nodeuser/.local/share/mise/shims:$PATH"

# Expose port for Astro dev server
EXPOSE 4321

# Default command
CMD ["bash"]
